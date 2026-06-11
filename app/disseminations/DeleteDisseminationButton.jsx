"use client";

import { useState } from "react";
import { useAuth } from "../AuthContext";

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbynZfRwktqV30Wf4Np3oRWAdeWu02JQkfN6zZNQnV2Vk9tEy_h-Dps9js5ZKXJbjvGcPg/exec";

export default function DeleteDisseminationButton({ sheetName, rowIndex, borderColor }) {
  const { adminUser, isLoaded } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleted, setDeleted] = useState(false);

  // Only show to the admin of this specific council
  if (!isLoaded || !adminUser || adminUser.council !== sheetName) return null;
  if (deleted) return null;

  const handleDelete = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to permanently delete this dissemination? This cannot be undone."
    );
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await fetch(SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          action: "deleteRow",
          sheetName,
          rowIndex,
        }),
      });
      // Since no-cors returns opaque response, assume success and reload
      window.location.reload();
    } catch (error) {
      console.error("Delete failed:", error);
      alert("Failed to delete. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      title="Delete this dissemination"
      style={{
        position: 'absolute',
        top: '-8px',
        right: '-8px',
        width: '28px',
        height: '28px',
        borderRadius: '50%',
        backgroundColor: '#ef4444',
        border: `2px solid ${borderColor || '#ef4444'}`,
        color: 'white',
        cursor: isDeleting ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '0.9rem',
        fontWeight: '900',
        lineHeight: 1,
        boxShadow: '0 2px 8px rgba(239,68,68,0.5)',
        opacity: isDeleting ? 0.6 : 1,
        transition: 'transform 0.15s, opacity 0.15s',
        zIndex: 10,
      }}
      onMouseEnter={e => { if (!isDeleting) e.currentTarget.style.transform = 'scale(1.2)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
    >
      {isDeleting ? '…' : '✕'}
    </button>
  );
}
