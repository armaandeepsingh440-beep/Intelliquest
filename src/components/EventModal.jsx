import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

const EventModal = ({ event, isOpen, onClose }) => {
  const [isRendered, setIsRendered] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      document.body.style.overflow = 'hidden';
    } else {
      setTimeout(() => setIsRendered(false), 300); // match transition duration
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isRendered && !isOpen) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        background: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(8px)',
        opacity: isOpen ? 1 : 0,
        transition: 'opacity 0.3s ease',
        pointerEvents: isOpen ? 'auto' : 'none'
      }}
      onClick={onClose}
    >
      <div 
        className="glass-card" 
        style={{
          width: '100%',
          maxWidth: '600px',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          transform: isOpen ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(20px)',
          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          background: 'rgba(20, 20, 25, 0.85)',
          overflow: 'hidden' // hide inner scrollbar sticking out
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ 
          padding: '20px 24px', 
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ fontSize: '1.5rem', margin: 0 }}>
            {event?.title} <span style={{ color: 'var(--neon-purple)' }}>Rules</span>
          </h2>
          <button 
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex'
            }}
          >
            <X size={24} />
          </button>
        </div>
        
        <div style={{ 
          padding: '24px', 
          overflowY: 'auto',
          color: 'var(--text-main)',
          lineHeight: 1.6
        }}>
          {event?.rules ? (
            <div dangerouslySetInnerHTML={{ __html: event.rules.replace(/\n/g, '<br/>') }} />
          ) : (
            <p>No specific rules provided for this event. Please follow general guidelines.</p>
          )}
        </div>
        
        <div style={{ 
          padding: '20px 24px', 
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          justifyContent: 'flex-end'
        }}>
          <button className="btn btn-outline" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventModal;
