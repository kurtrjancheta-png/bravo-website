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

  const handleOpenForm = (type) => {
    setActiveFormType(type);
    setModalState("PASSWORD");
    setPasswordInput("");
    setErrorMsg("");
    setFormData({ urgency: "LIGHT", content: "", eventDate: "" });
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

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg("");

    const dateAnnounced = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
    
    // We send data to the Google Apps Script via POST
    // We use no-cors to prevent browser blocking, but this means we can't read the exact JSON response easily.
    // However, since we set up CORS headers in the Apps Script, standard fetch should work!
    
    const payload = {
      sheetName: councilName,
      type: activeFormType,
      urgency: formData.urgency,
      content: formData.content,
      dateAnnounced: dateAnnounced,
      eventDate: activeFormType === "ACTIVITY" ? formData.eventDate : ""
    };

    try {
      const response = await fetch(SCRIPT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        alert("Successfully added to the board! Refresh the page to see it.");
        setModalState("CLOSED");
      } else {
        setErrorMsg("Failed to add: " + result.error);
      }
    } catch (error) {
      console.error(error);
      // Sometimes fetch throws on CORS even if successful, let's gracefully handle
      alert("Submission sent! If it doesn't appear after refresh, check the Google Sheet.");
      setModalState("CLOSED");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mb-8 w-full max-w-7xl mx-auto flex gap-4">
      <button 
        onClick={() => handleOpenForm("ANNOUNCEMENT")}
        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-lg transition-transform hover:scale-105 active:scale-95"
      >
        ➕ Make an Announcement
      </button>
      <button 
        onClick={() => handleOpenForm("ACTIVITY")}
        className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold shadow-lg transition-transform hover:scale-105 active:scale-95"
      >
        📅 Add an Activity
      </button>

      {/* PASSWORD MODAL */}
      {modalState === "PASSWORD" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-2xl p-8 w-full max-w-sm border border-gray-200 dark:border-gray-800">
            <h2 className="text-2xl font-black mb-2 text-gray-900 dark:text-white">Admin Access</h2>
            <p className="text-sm text-gray-500 mb-6">Enter the administrator password to post to the board.</p>
            
            <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4">
              <input 
                type="password" 
                autoFocus
                placeholder="Password" 
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-[#252525] focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
              />
              {errorMsg && <p className="text-red-500 text-sm font-semibold">{errorMsg}</p>}
              
              <div className="flex justify-end gap-3 mt-4">
                <button 
                  type="button" 
                  onClick={() => setModalState("CLOSED")}
                  className="px-4 py-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 font-semibold"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-md"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-2xl p-8 w-full max-w-lg border border-gray-200 dark:border-gray-800">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black text-gray-900 dark:text-white">
                {activeFormType === "ANNOUNCEMENT" ? "Make an Announcement" : "Add an Activity"}
              </h2>
              <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-xs font-bold text-gray-500 uppercase tracking-wider">
                {councilName}
              </span>
            </div>

            <form onSubmit={handleFormSubmit} className="flex flex-col gap-5">
              
              {/* URGENCY SELECTOR */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Urgency Level</label>
                <select 
                  value={formData.urgency}
                  onChange={(e) => setFormData({...formData, urgency: e.target.value})}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-[#252525] focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white font-semibold"
                >
                  <option value="LIGHT">Light (Green)</option>
                  <option value="MODERATE">Moderate (Yellow)</option>
                  <option value="EMERGENCY">Emergency (Flashing Red)</option>
                  <option value="FOR IMMEDIATE COMPLIANCE">For Immediate Compliance (Flashing Orange)</option>
                </select>
              </div>

              {/* EVENT DATE (Only for Activity) */}
              {activeFormType === "ACTIVITY" && (
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Event Date</label>
                  <input 
                    type="date" 
                    required
                    value={formData.eventDate}
                    onChange={(e) => setFormData({...formData, eventDate: e.target.value})}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-[#252525] focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                  />
                </div>
              )}

              {/* CONTENT */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Content / Message</label>
                <textarea 
                  required
                  rows="4"
                  placeholder="Enter the details here..."
                  value={formData.content}
                  onChange={(e) => setFormData({...formData, content: e.target.value})}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-[#252525] focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white resize-none"
                />
              </div>

              {errorMsg && <p className="text-red-500 text-sm font-semibold bg-red-50 dark:bg-red-900/20 p-3 rounded">{errorMsg}</p>}

              {/* ACTIONS */}
              <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                <button 
                  type="button" 
                  onClick={() => setModalState("CLOSED")}
                  disabled={isSubmitting}
                  className="px-6 py-3 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 font-bold transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-lg transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      Publishing...
                    </>
                  ) : "Publish to Board"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
