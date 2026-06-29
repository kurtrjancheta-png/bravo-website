"use client";

import { useState } from "react";
import { useAuth } from "../AuthContext";
import { motion, AnimatePresence } from "framer-motion";

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

export default function ViewConcernsAdmin({ councilName, appsScriptUrl }) {
  const { adminUser, isLoaded } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [concerns, setConcerns] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isLoaded || !adminUser || !isMatchingCouncil(adminUser.council, councilName)) {
    return null;
  }

  const fetchConcerns = async () => {
    setIsLoading(true);
    setError("");
    
    try {
      const url = new URL(appsScriptUrl);
      url.searchParams.append("action", "getConcerns");
      url.searchParams.append("councilName", councilName);
      
      const response = await fetch(url.toString(), {
        method: "GET"
      });
      
      const data = await response.json();
      if (data.status === "success") {
        setConcerns(data.concerns || []);
      } else {
        setError(data.message || "Failed to fetch concerns.");
      }
    } catch (err) {
      console.error("Error fetching concerns:", err);
      // Since Google Apps Script no-cors can cause opaque responses if we aren't careful,
      // using standard fetch without no-cors might fail if Apps Script isn't set up perfectly.
      // Assuming Apps Script is set up with doOptions for CORS.
      setError("Network error or CORS issue. Please ensure the Apps Script allows cross-origin requests.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpen = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      fetchConcerns();
    }
  };

  return (
    <div style={{ marginTop: "2rem", borderTop: "1px solid var(--border-color)", paddingTop: "2rem" }}>
      <button
        onClick={handleOpen}
        style={{
          background: "transparent",
          color: "var(--text-primary)",
          border: "1px solid var(--border-color)",
          padding: "0.75rem 1.5rem",
          borderRadius: "8px",
          fontWeight: 700,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem"
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          {isOpen ? (
            <>
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </>
          ) : (
            <>
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </>
          )}
        </svg>
        {isOpen ? "Hide Council Concerns" : "View Council Concerns"}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: "hidden", marginTop: "1rem" }}
          >
            <div style={{ background: "var(--bg-secondary)", borderRadius: "12px", padding: "1.5rem", border: "1px solid var(--border-color)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                <h3 style={{ margin: 0, display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-primary)" }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                  </svg>
                  Confidential Concerns ({concerns.length})
                </h3>
                <button 
                  onClick={fetchConcerns} 
                  disabled={isLoading}
                  style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}
                  title="Refresh"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: isLoading ? "spin 1s linear infinite" : "none" }}>
                    <polyline points="23 4 23 10 17 10"></polyline>
                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                  </svg>
                </button>
              </div>

              {isLoading ? (
                <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-secondary)" }}>Loading concerns securely...</div>
              ) : error ? (
                <div style={{ padding: "1rem", color: "#ef4444", background: "rgba(239, 68, 68, 0.1)", borderRadius: "8px" }}>{error}</div>
              ) : concerns.length === 0 ? (
                <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-secondary)", fontStyle: "italic" }}>
                  No concerns have been submitted to {councilName} yet.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {concerns.map((c, i) => (
                    <div key={i} style={{ background: "var(--bg-primary)", padding: "1.5rem", borderRadius: "12px", border: "1px solid var(--border-color)", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
                        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                          <span style={{ background: "rgba(59, 130, 246, 0.1)", color: "#3b82f6", padding: "0.25rem 0.5rem", borderRadius: "4px", fontSize: "0.8rem", fontWeight: 700 }}>
                            {c.name || "Anonymous"}
                          </span>
                          {c.class && (
                            <span style={{ background: "rgba(107, 114, 128, 0.1)", color: "var(--text-secondary)", padding: "0.25rem 0.5rem", borderRadius: "4px", fontSize: "0.8rem", fontWeight: 600 }}>
                              {c.class}
                            </span>
                          )}
                          {c.barracks && (
                            <span style={{ background: "rgba(107, 114, 128, 0.1)", color: "var(--text-secondary)", padding: "0.25rem 0.5rem", borderRadius: "4px", fontSize: "0.8rem", fontWeight: 600 }}>
                              {c.barracks}
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{c.dateSubmitted}</span>
                      </div>
                      
                      <div style={{ fontSize: "1.05rem", color: "var(--text-primary)", whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
                        {c.concern}
                      </div>

                      {(c.files || c.pictures) && (
                        <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px dashed var(--border-color)" }}>
                          <h4 style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.5rem", textTransform: "uppercase" }}>Attachments</h4>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                            {c.pictures && c.pictures.split(",").map((url, j) => (
                              <a key={`pic-${j}`} href={url.trim()} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", background: "rgba(16, 185, 129, 0.1)", color: "#10b981", padding: "0.25rem 0.75rem", borderRadius: "9999px", fontSize: "0.8rem", textDecoration: "none", fontWeight: 600 }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                  <polyline points="21 15 16 10 5 21"></polyline>
                                </svg>
                                Image {j + 1}
                              </a>
                            ))}
                            {c.files && c.files.split(",").map((url, j) => (
                              <a key={`file-${j}`} href={url.trim()} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", background: "rgba(139, 92, 246, 0.1)", color: "#8b5cf6", padding: "0.25rem 0.75rem", borderRadius: "9999px", fontSize: "0.8rem", textDecoration: "none", fontWeight: 600 }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                                  <polyline points="13 2 13 9 20 9"></polyline>
                                </svg>
                                File {j + 1}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
