"use client";

import { useState } from "react";
import { useAuth } from "../AuthContext";
import { encryptBytes } from "../../lib/crypto";

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbynZfRwktqV30Wf4Np3oRWAdeWu02JQkfN6zZNQnV2Vk9tEy_h-Dps9js5ZKXJbjvGcPg/exec";

const isMatchingCouncil = (userCouncil, formCouncil) => {
  if (!userCouncil || !formCouncil) return false;
  const u = String(userCouncil).toUpperCase().replace(/[^A-Z0-9]/g, '');
  const f = String(formCouncil).toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (u === 'S6' || u.includes('CEIS')) return true; // CEIS has super access
  if ((u === 'HCOMM' || u === 'HONORCOMM') && (f === 'HCOMM' || f === 'HONORCOMM' || f === 'HONORCOMMITTEE')) {
    return true;
  }
  return u === f;
};

export default function CouncilAdminForms({ councilName }) {
  const [modalState, setModalState] = useState("CLOSED"); // CLOSED, FORM
  const [activeFormType, setActiveFormType] = useState(""); // ANNOUNCEMENT or ACTIVITY
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { adminUser, isLoaded } = useAuth();

  // Form State
  const [formData, setFormData] = useState({
    urgency: "FOR INFO",
    headline: "",
    content: "",
    eventDate: ""
  });
  
  // File State
  const [selectedFiles, setSelectedFiles] = useState([]);

  // Only render if the user is authenticated as the correct council administrator
  if (!isLoaded || !adminUser || !isMatchingCouncil(adminUser.council, councilName)) {
    return null;
  }

  const handleOpenForm = (type) => {
    setActiveFormType(type);
    setModalState("FORM");
    setErrorMsg("");
    setFormData({ urgency: "FOR INFO", headline: "", content: "", eventDate: "" });
    setSelectedFiles([]);
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const totalSize = files.reduce((acc, file) => acc + file.size, 0);
      if (totalSize > 10 * 1024 * 1024) {
        alert("Total file size exceeds 10MB limit.");
        e.target.value = "";
        return;
      }
      
      const processedFiles = [];
      for (const file of files) {
        // Read file as ArrayBuffer
        const arrayBuffer = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.readAsArrayBuffer(file);
        });

        // Encrypt the array buffer
        const encryptedBytes = await encryptBytes(arrayBuffer);
        
        // Convert encrypted bytes to base64 string
        let binary = '';
        const len = encryptedBytes.byteLength;
        for (let i = 0; i < len; i++) {
          binary += String.fromCharCode(encryptedBytes[i]);
        }
        const base64String = window.btoa(binary);
        
        processedFiles.push({
          fileName: `[ENC]_${file.name}`,
          mimeType: 'application/octet-stream',
          fileData: base64String
        });
      }
      setSelectedFiles(processedFiles);
    } else {
      setSelectedFiles([]);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg("");

    const dateAnnounced = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
    
    const finalContent = activeFormType === "ANNOUNCEMENT"
      ? `${formData.headline.trim()}:${formData.content.trim()}`
      : formData.content.trim();

    const payload = {
      sheetName: councilName,
      type: activeFormType,
      urgency: formData.urgency,
      content: finalContent,
      dateAnnounced: dateAnnounced,
      eventDate: activeFormType === "ACTIVITY" ? formData.eventDate : "",
      files: selectedFiles
    };

    // Helper to map tab names to URL paths
    const getCouncilPath = (name) => {
      const n = String(name || '').trim().toUpperCase();
      if (n === 'HONOR COMM') return 'honor-comm';
      return n.toLowerCase();
    };

    try {
      // 1. Resolve row count to calculate the new row index for deep-linking
      let targetRow = "";
      try {
        const SHEET_ID = '1YeaoloRz4REe_iVomGfFI9WugalrDFsHiz04eOcD0a8';
        const gvizUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${councilName}&cb=${Date.now()}`;
        const gvizRes = await fetch(gvizUrl);
        const gvizText = await gvizRes.text();
        const jsonString = gvizText.substring(gvizText.indexOf('{'), gvizText.lastIndexOf('}') + 1);
        const gvizData = JSON.parse(jsonString);
        const rowCount = gvizData.table.rows.length;
        targetRow = rowCount + 2; // Row offset: 1-indexed + header row
      } catch (e) {
        console.warn("Could not calculate target row index:", e);
      }

      // 2. Post to Google Sheet (Existing logic)
      await fetch(SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "text/plain;charset=utf-8",
        },
        body: JSON.stringify(payload),
      });

      // 3. Dispatch web push broadcast to all subscribed devices
      const pushTitle = activeFormType === "ANNOUNCEMENT" 
        ? `📢 BRAVO BULLETIN: ${formData.headline.trim()}` 
        : `📅 BRAVO ACTIVITY: ${formData.urgency}`;

      const pushBody = activeFormType === "ANNOUNCEMENT" 
        ? formData.content.trim() 
        : `Urgency: ${formData.urgency}\nEvent Date: ${formData.eventDate}\n${formData.content.trim()}`;

      const targetPath = `/disseminations/${getCouncilPath(councilName)}${targetRow ? '?row=' + targetRow : ''}`;

      try {
        await fetch('/api/web-push/broadcast', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: pushTitle,
            body: pushBody,
            url: targetPath
          })
        });
      } catch (pushErr) {
        console.error("Failed to dispatch push broadcast:", pushErr);
      }

      alert("Successfully added to the board and broadcasted alert! Refresh the page to see it.");
      window.location.reload();
      setModalState("CLOSED");
    } catch (error) {
      console.error(error);
      setErrorMsg("Failed to connect to the server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
      <button 
        onClick={() => handleOpenForm("ANNOUNCEMENT")}
        style={{
          padding: '0.75rem 1.5rem',
          backgroundColor: '#2563eb',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontWeight: 'bold',
          cursor: 'pointer',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
      >
        ➕ Make an Announcement
      </button>
      <button 
        onClick={() => handleOpenForm("ACTIVITY")}
        style={{
          padding: '0.75rem 1.5rem',
          backgroundColor: '#9333ea',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontWeight: 'bold',
          cursor: 'pointer',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
      >
        📅 Add an Activity
      </button>


      {/* SUBMISSION FORM MODAL */}
      {modalState === "FORM" && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(4px)',
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '16px',
            padding: '2rem',
            width: '100%',
            maxWidth: '500px',
            border: '1px solid var(--border-color)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--text-primary)' }}>
                {activeFormType === "ANNOUNCEMENT" ? "Make an Announcement" : "Add an Activity"}
              </h2>
              <span style={{
                padding: '0.25rem 0.75rem',
                backgroundColor: 'rgba(255,255,255,0.1)',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: 'bold',
                color: 'var(--text-secondary)',
                textTransform: 'uppercase'
              }}>
                {councilName}
              </span>
            </div>

            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* URGENCY SELECTOR */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Urgency Level</label>
                <select 
                  value={formData.urgency}
                  onChange={(e) => setFormData({...formData, urgency: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'rgba(0,0,0,0.2)',
                    color: 'var(--text-primary)',
                    fontSize: '1rem',
                    fontWeight: 'bold'
                  }}
                >
                  <option value="FOR INFO" style={{ color: 'black' }}>For Info</option>
                  <option value="ATTENTION" style={{ color: 'black' }}>Attention</option>
                  <option value="URGENT" style={{ color: 'black' }}>Urgent</option>
                  <option value="FOR STRICT COMPLIANCE" style={{ color: 'black' }}>For Strict Compliance</option>
                </select>
              </div>

              {/* EVENT DATE (Only for Activity) */}
              {activeFormType === "ACTIVITY" && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Event Date</label>
                  <input 
                    type="date" 
                    required
                    value={formData.eventDate}
                    onChange={(e) => setFormData({...formData, eventDate: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'rgba(0,0,0,0.2)',
                      color: 'var(--text-primary)',
                      fontSize: '1rem'
                    }}
                  />
                </div>
              )}

              {/* HEADLINE */}
              {activeFormType === "ANNOUNCEMENT" && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Headline</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Enter the headline of the announcement..."
                    value={formData.headline || ""}
                    onChange={(e) => setFormData({...formData, headline: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'rgba(0,0,0,0.2)',
                      color: 'var(--text-primary)',
                      fontSize: '1rem'
                    }}
                  />
                </div>
              )}

              {/* CONTENT */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Content / Message</label>
                <textarea 
                  required
                  rows="4"
                  placeholder="Enter the details here..."
                  value={formData.content}
                  onChange={(e) => setFormData({...formData, content: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'rgba(0,0,0,0.2)',
                    color: 'var(--text-primary)',
                    fontSize: '1rem',
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* ATTACHMENT */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Attach Media / Document (Optional)</label>
                <input 
                  type="file" 
                  multiple
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={handleFileChange}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    border: '1px dashed var(--border-color)',
                    backgroundColor: 'rgba(0,0,0,0.1)',
                    color: 'var(--text-primary)',
                    fontSize: '0.875rem',
                    cursor: 'pointer'
                  }}
                />
              </div>

              {errorMsg && (
                <p style={{ color: '#ef4444', fontSize: '0.875rem', fontWeight: 'bold', backgroundColor: 'rgba(239,68,68,0.1)', padding: '0.75rem', borderRadius: '4px' }}>
                  {errorMsg}
                </p>
              )}

              {/* ACTIONS */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                <button 
                  type="button" 
                  onClick={() => setModalState("CLOSED")}
                  disabled={isSubmitting}
                  style={{
                    padding: '0.75rem 1.5rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'transparent',
                    color: 'var(--text-secondary)',
                    fontWeight: 'bold',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    opacity: isSubmitting ? 0.5 : 1
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  style={{
                    padding: '0.75rem 2rem',
                    backgroundColor: '#2563eb',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    opacity: isSubmitting ? 0.5 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  {isSubmitting ? "Publishing..." : "Publish to Board"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
