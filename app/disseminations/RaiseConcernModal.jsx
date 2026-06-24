"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function RaiseConcernModal({ councilName, appsScriptUrl }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // 'success' or 'error'

  const [formData, setFormData] = useState({
    name: "",
    class: "",
    gender: "",
    barracks: "",
    concern: ""
  });
  
  const [selectedFiles, setSelectedFiles] = useState([]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      // Check total file size (limit to 10MB)
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.concern.trim()) return;

    setIsSubmitting(true);
    setSubmitStatus(null);

    const dateSubmitted = new Date().toLocaleString('en-US', { 
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });

    const payload = {
      action: "addConcern",
      name: formData.name,
      class: formData.class,
      gender: formData.gender,
      barracks: formData.barracks,
      concernTo: councilName,
      dateSubmitted: dateSubmitted,
      concern: formData.concern,
      files: selectedFiles
    };

    try {
      await fetch(appsScriptUrl, {
        method: "POST",
        mode: "no-cors", // Google Apps Script requires this for cross-origin POSTs from browser
        headers: {
          "Content-Type": "text/plain", // Avoids preflight
        },
        body: JSON.stringify(payload)
      });
      
      // With no-cors, we don't get a proper readable response, so we assume success if no exception
      setSubmitStatus('success');
      setTimeout(() => {
        setIsOpen(false);
        setSubmitStatus(null);
        setFormData({ name: "", class: "", gender: "", barracks: "", concern: "" });
        setSelectedFiles([]);
      }, 2000);
      
    } catch (error) {
      console.error("Error submitting concern:", error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        style={{
          background: "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)",
          color: "white",
          border: "none",
          padding: "0.75rem 1.5rem",
          borderRadius: "8px",
          fontWeight: 800,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          boxShadow: "0 4px 6px rgba(239, 68, 68, 0.3)",
          marginBottom: "2rem"
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
          <line x1="12" y1="9" x2="12" y2="13"></line>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
        Raise a Concern to {councilName}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <div style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(0,0,0,0.7)", zIndex: 9999,
            display: "flex", justifyContent: "center", alignItems: "center", padding: "1rem", backdropFilter: "blur(4px)"
          }} onClick={() => !isSubmitting && setIsOpen(false)}>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "var(--bg-primary)",
                border: "1px solid var(--border-color)",
                borderRadius: "16px",
                padding: "2rem",
                width: "100%",
                maxWidth: "600px",
                maxHeight: "90vh",
                overflowY: "auto",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                <h2 style={{ fontSize: "1.5rem", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                    <line x1="12" y1="9" x2="12" y2="13"></line>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                  </svg>
                  Raise a Concern
                </h2>
                <button 
                  onClick={() => setIsOpen(false)}
                  disabled={isSubmitting}
                  style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", padding: "0.5rem" }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>

              {submitStatus === 'success' ? (
                <div style={{ padding: "3rem 1rem", textAlign: "center", color: "#10b981" }}>
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ margin: "0 auto 1rem" }}>
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                  <h3>Concern Submitted Securely</h3>
                  <p style={{ color: "var(--text-secondary)", marginTop: "0.5rem" }}>Thank you. Your concern has been sent to {councilName}.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  
                  <div style={{ padding: "1rem", background: "rgba(59, 130, 246, 0.1)", border: "1px solid rgba(59, 130, 246, 0.2)", borderRadius: "8px", color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                    <strong>Privacy Notice:</strong> The following demographic fields are completely optional. You may submit your concern anonymously if you prefer.
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div>
                      <label style={{ display: "block", marginBottom: "0.25rem", color: "var(--text-secondary)", fontSize: "0.85rem" }}>Name (Optional)</label>
                      <input 
                        type="text" name="name" value={formData.name} onChange={handleInputChange}
                        placeholder="e.g. Cdt Dela Cruz"
                        style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", background: "var(--bg-secondary)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", marginBottom: "0.25rem", color: "var(--text-secondary)", fontSize: "0.85rem" }}>Class (Optional)</label>
                      <select 
                        name="class" value={formData.class} onChange={handleInputChange}
                        style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", background: "var(--bg-secondary)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }}
                      >
                        <option value="">Select Class</option>
                        <option value="1CL">1CL</option>
                        <option value="2CL">2CL</option>
                        <option value="3CL">3CL</option>
                        <option value="4CL">4CL</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: "block", marginBottom: "0.25rem", color: "var(--text-secondary)", fontSize: "0.85rem" }}>Gender (Optional)</label>
                      <select 
                        name="gender" value={formData.gender} onChange={handleInputChange}
                        style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", background: "var(--bg-secondary)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }}
                      >
                        <option value="">Select Gender</option>
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: "block", marginBottom: "0.25rem", color: "var(--text-secondary)", fontSize: "0.85rem" }}>Barracks (Optional)</label>
                      <select 
                        name="barracks" value={formData.barracks} onChange={handleInputChange}
                        style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", background: "var(--bg-secondary)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }}
                      >
                        <option value="">Select Barracks</option>
                        <option value="FLORENDO HALL">Florendo Hall</option>
                        <option value="REGIS HALL">Regis Hall</option>
                        <option value="ENRILE HALL">Enrile Hall</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: "block", marginBottom: "0.25rem", color: "var(--text-primary)", fontWeight: 600 }}>
                      Your Concern <span style={{ color: "#ef4444" }}>*</span>
                    </label>
                    <textarea 
                      name="concern" value={formData.concern} onChange={handleInputChange} required
                      placeholder={`Detail your concern to ${councilName}...`}
                      rows={5}
                      style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", background: "var(--bg-secondary)", border: "1px solid var(--border-color)", color: "var(--text-primary)", resize: "vertical" }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", marginBottom: "0.25rem", color: "var(--text-secondary)", fontSize: "0.85rem" }}>Upload Evidence/Pictures (Optional)</label>
                    <input 
                      type="file" multiple onChange={handleFileChange}
                      style={{ width: "100%", padding: "0.5rem", borderRadius: "8px", background: "var(--bg-secondary)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }}
                    />
                    <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>Max total size: 10MB</div>
                  </div>

                  {submitStatus === 'error' && (
                    <div style={{ color: "#ef4444", fontSize: "0.9rem", padding: "0.5rem", background: "rgba(239, 68, 68, 0.1)", borderRadius: "4px" }}>
                      An error occurred while submitting your concern. Please try again.
                    </div>
                  )}

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "1rem" }}>
                    <button 
                      type="button" onClick={() => setIsOpen(false)} disabled={isSubmitting}
                      style={{ padding: "0.75rem 1.5rem", borderRadius: "8px", background: "transparent", border: "1px solid var(--border-color)", color: "var(--text-primary)", cursor: "pointer" }}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" disabled={isSubmitting || !formData.concern.trim()}
                      style={{ padding: "0.75rem 1.5rem", borderRadius: "8px", background: "#ef4444", border: "none", color: "white", fontWeight: 700, cursor: (isSubmitting || !formData.concern.trim()) ? "not-allowed" : "pointer", opacity: (isSubmitting || !formData.concern.trim()) ? 0.7 : 1 }}
                    >
                      {isSubmitting ? "Submitting..." : "Submit Concern"}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
