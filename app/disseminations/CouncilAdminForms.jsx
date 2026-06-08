"use client";

import { useState } from "react";

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbynZfRwktqV30Wf4Np3oRWAdeWu02JQkfN6zZNQnV2Vk9tEy_h-Dps9js5ZKXJbjvGcPg/exec";

export default function CouncilAdminForms({ councilName }) {
  const [modalState, setModalState] = useState("CLOSED"); // CLOSED, PASSWORD, FORM
  const [activeFormType, setActiveFormType] = useState(""); // ANNOUNCEMENT or ACTIVITY
  const [passwordInput, setPasswordInput] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    urgency: "LIGHT",
    content: "",
    eventDate: ""
  });
  
  // File State
  const [selectedFiles, setSelectedFiles] = useState([]);

  const handleOpenForm = (type) => {
    setActiveFormType(type);
    setModalState("PASSWORD");
    setPasswordInput("");
    setErrorMsg("");
    setFormData({ urgency: "LIGHT", content: "", eventDate: "" });
    setSelectedFiles([]);
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (passwordInput === "Admin") {
      setModalState("FORM");
      setErrorMsg("");
    } else {
      setErrorMsg("Incorrect Administrator Password.");
    }
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      // Check total file size (limit to 10MB to avoid overwhelming base64 conversion / apps script limits)
      const totalSize = files.reduce((acc, file) => acc + file.size, 0);
      if (totalSize > 10 * 1024 * 1024) {
        alert("Total file size exceeds 10MB limit.");
        e.target.value = "";
        return;
      }
      
      const processedFiles = [];
      for (const file of files) {
        const base64String = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result.split(',')[1]);
          reader.readAsDataURL(file);
        });
        
        processedFiles.push({
          fileName: file.name,
          mimeType: file.type,
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
    
    // We send data to the Google Apps Script via POST
    const payload = {
      sheetName: councilName,
      type: activeFormType,
      urgency: formData.urgency,
      content: formData.content,
      dateAnnounced: dateAnnounced,
      eventDate: activeFormType === "ACTIVITY" ? formData.eventDate : "",
      files: selectedFiles
    };

    try {
      // Use no-cors and text/plain to avoid CORS preflight errors with Google Apps Script
      const response = await fetch(SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "text/plain;charset=utf-8",
        },
        body: JSON.stringify(payload),
      });

      // Since we use no-cors, the response is opaque and we can't read response.json()
      // We will assume it's successful if the fetch didn't throw an error.
      alert("Successfully added to the board! Refresh the page to see it.");
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

      {/* PASSWORD MODAL */}
      {modalState === "PASSWORD" && (
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
            maxWidth: '400px',
            border: '1px solid var(--border-color)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
          }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '900', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Admin Access</h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Enter the administrator password to post to the board.</p>
            
            <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input 
                type="password" 
                autoFocus
                placeholder="Password" 
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
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
              {errorMsg && <p style={{ color: '#ef4444', fontSize: '0.875rem', fontWeight: 'bold' }}>{errorMsg}</p>}
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button 
                  type="button" 
                  onClick={() => setModalState("CLOSED")}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'transparent',
                    color: 'var(--text-secondary)',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#2563eb',
                    color: 'white',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  Unlock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                  <option value="LIGHT" style={{ color: 'black' }}>For Info</option>
                  <option value="MODERATE" style={{ color: 'black' }}>Attention</option>
                  <option value="EMERGENCY" style={{ color: 'black' }}>Urgent</option>
                  <option value="FOR IMMEDIATE COMPLIANCE" style={{ color: 'black' }}>For Immediate Compliance</option>
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
