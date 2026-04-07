import React from 'react';
import { Calendar, Users, Eye, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const EventCard = ({ event, onViewRules }) => {
  const navigate = useNavigate();

  return (
    <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <h3 style={{ fontSize: '1.5rem', color: 'var(--text-main)', marginBottom: '8px' }}>{event.title}</h3>
        <div style={{ 
          background: 'rgba(0, 243, 255, 0.1)', 
          color: 'var(--neon-blue)', 
          padding: '4px 12px', 
          borderRadius: '20px', 
          fontSize: '0.85rem',
          fontWeight: 600,
          border: '1px solid rgba(0, 243, 255, 0.2)'
        }}>
          ₹{event.price}
        </div>
      </div>
      
      <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.5, flex: 1 }}>
        {event.description}
      </p>
      
      <div className="flex flex-col gap-2" style={{ marginTop: '10px' }}>
        <div className="flex items-center gap-2" style={{ color: '#ccc', fontSize: '0.9rem' }}>
          <Calendar size={16} color="var(--neon-purple)" />
          <span>{event.date}</span>
        </div>
        <div className="flex items-center gap-2" style={{ color: '#ccc', fontSize: '0.9rem' }}>
          <Users size={16} color="var(--neon-gold)" />
          <span>Team Size: {event.teamSize}</span>
        </div>
      </div>
      
      <div className="flex gap-4" style={{ marginTop: '16px' }}>
        <button 
          className="btn btn-outline w-full flex items-center gap-2 justify-center" 
          onClick={() => onViewRules(event)}
          style={{ padding: '10px' }}
        >
          <Eye size={18} /> Rules
        </button>
        <button 
          className="btn btn-primary w-full flex items-center gap-2 justify-center"
          onClick={() => navigate(`/register/${event.id}`)}
          style={{ padding: '10px' }}
        >
          Register <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
};

export default EventCard;
