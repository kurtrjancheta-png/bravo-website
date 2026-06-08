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
            const imageUrl = `https://drive.google.com/thumbnail?id=${driveId}&sz=w1000`;
            return (
              <div 
                key={idx}
                style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}
              >
                <div
                  onClick={() => setActiveImage({ url: imageUrl, originalLink: cleanUrl })}
                  style={{
                    width: '120px',
                    height: '120px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    cursor: 'zoom-in',
                    border: '1px solid var(--border-color)',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    backgroundColor: 'rgba(255,255,255,0.05)'
                  }}
                >
                  <img 
                    src={imageUrl} 
                    alt={`Attachment ${idx + 1}`} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
                <a 
                  href={cleanUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: '0.75rem', color: 'var(--accent-blue)', textDecoration: 'none', textAlign: 'center' }}
                >
                  Open File
                </a>
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
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            cursor: 'zoom-out'
          }}
        >
          <img 
            src={activeImage.url} 
            alt="Enlarged Attachment" 
            style={{ 
              maxWidth: '100%', 
              maxHeight: '90%', 
              objectFit: 'contain',
              borderRadius: '8px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
            }} 
          />
          <a 
            href={activeImage.originalLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            style={{
              marginTop: '1rem',
              padding: '0.75rem 1.5rem',
              backgroundColor: 'var(--accent-blue)',
              color: 'white',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 'bold',
              fontSize: '1rem'
            }}
          >
            Open Original File in Google Drive
          </a>
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
