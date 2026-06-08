"use client";

import { useState } from 'react';

export default function ImageGallery({ urls }) {
  const [activeImage, setActiveImage] = useState(null);

  if (!urls || urls.length === 0) return null;

  // Function to extract Google Drive file ID from URL
  const getDriveId = (url) => {
    const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
  };

  return (
    <>
      <div style={{ marginTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
        {urls.map((url, idx) => {
          if (!url.trim()) return null;
          const cleanUrl = url.trim();
          const driveId = getDriveId(cleanUrl);

          if (driveId) {
            const imageUrl = `https://drive.google.com/uc?export=view&id=${driveId}`;
            return (
              <div 
                key={idx}
                onClick={() => setActiveImage(imageUrl)}
                style={{
                  width: '100px',
                  height: '100px',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  border: '1px solid var(--border-color)',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
              >
                <img 
                  src={imageUrl} 
                  alt={`Attachment ${idx + 1}`} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            );
          }

          // Fallback to button if it's not a recognizable drive link
          return (
            <a 
              key={idx}
              href={cleanUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                textDecoration: 'none',
                fontSize: '0.875rem',
                fontWeight: 'bold',
                transition: 'all 0.2s ease',
                height: 'fit-content'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
            >
              📎 View Document
            </a>
          );
        })}
      </div>

      {/* FULL SCREEN LIGHTBOX */}
      {activeImage && (
        <div 
          onClick={() => setActiveImage(null)}
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.9)',
            backdropFilter: 'blur(8px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            cursor: 'zoom-out'
          }}
        >
          <img 
            src={activeImage} 
            alt="Enlarged Attachment" 
            style={{ 
              maxWidth: '100%', 
              maxHeight: '100%', 
              objectFit: 'contain',
              borderRadius: '8px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
            }} 
          />
          <button 
            onClick={() => setActiveImage(null)}
            style={{
              position: 'absolute',
              top: '2rem',
              right: '2rem',
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              fontSize: '1.5rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
}
