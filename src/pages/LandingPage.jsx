import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import EventCard from '../components/EventCard';
import EventModal from '../components/EventModal';
import { Phone, Mail, MapPin, Loader } from 'lucide-react';
import { useFirebase } from '../context/FirebaseContext';

const LandingPage = () => {
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { events, coordinators, siteSettings, loading, error } = useFirebase();

  const handleViewRules = (event) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: '20px' }}>
        <Loader className="animate-spin" size={48} color="var(--neon-blue)" style={{ animation: 'spin 1s linear infinite' }} />
        <h2 className="text-gradient">Loading PAIthon Association...</h2>
        <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: '80px' }}>
      <Navbar title={siteSettings?.associationName || "AIML Events"} />
      
      {/* Hero Section */}
      <section style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        paddingTop: '80px'
      }}>
        <div className="container flex-col items-center justify-center animate-fade-in" style={{ zIndex: 10 }}>
          <div className="glass-card" style={{ padding: '60px 40px', textAlign: 'center', maxWidth: '800px', width: '100%' }}>
            <h2 className="text-gradient" style={{ fontSize: '1.5rem', marginBottom: '16px', letterSpacing: '2px', textTransform: 'uppercase' }}>
              {siteSettings?.departmentName || "Department of AIML & CSE (AIML)"}
            </h2>
            <h1 className="text-gradient-gold" style={{ fontSize: '4rem', marginBottom: '24px', lineHeight: 1.1, textShadow: '0 0 20px rgba(255, 215, 0, 0.3)' }}>
              {siteSettings?.associationName || "PAIthon Association"}
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.4rem', marginBottom: '40px', fontWeight: 300 }}>
              {siteSettings?.subtitle || "Presents Technical Events — The Future of AI"}
            </p>
            
            <div className="flex justify-center gap-6">
              <a href="#events" className="btn btn-primary" style={{ padding: '14px 32px', fontSize: '1.1rem' }}>
                Explore Events
              </a>
              <a href="#coordinators" className="btn btn-outline" style={{ padding: '14px 32px', fontSize: '1.1rem' }}>
                Meet Coordinators
              </a>
            </div>
          </div>
        </div>
      </section>

      {error && (
        <div className="container" style={{ textAlign: 'center', color: 'var(--error)' }}>
          {error}
        </div>
      )}

      {/* Events Section */}
      <section id="events" className="container" style={{ padding: '100px 20px' }}>
        <h2 className="text-gradient" style={{ fontSize: '3rem', textAlign: 'center', marginBottom: '60px' }}>Technical Events</h2>
        
        {events.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
            <p>No upcoming events currently. Stay tuned!</p>
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
            gap: '30px' 
          }}>
            {events.map(event => (
              <EventCard 
                key={event.id} 
                event={event} 
                onViewRules={handleViewRules} 
              />
            ))}
          </div>
        )}
      </section>

      {/* Coordinators Section */}
      <section id="coordinators" className="container" style={{ padding: '60px 20px' }}>
        <div className="glass-card" style={{ padding: '40px' }}>
          <h2 className="text-gradient-gold" style={{ fontSize: '2.5rem', textAlign: 'center', marginBottom: '40px' }}>
            Event Coordinators
          </h2>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '40px', justifyContent: 'center' }}>
            <div style={{ flex: '1 1 300px', minWidth: '300px' }}>
              <h3 style={{ color: 'var(--neon-blue)', fontSize: '1.5rem', marginBottom: '20px', borderBottom: '1px solid rgba(0,243,255,0.2)', paddingBottom: '10px' }}>
                Faculty Coordinators
              </h3>
              <div className="flex-col gap-4">
                {coordinators.faculty.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)' }}>No faculty recorded.</p>
                ) : (
                  coordinators.faculty.map((coord, idx) => (
                    <div key={idx} className="flex justify-between items-center" style={{ background: 'rgba(255,255,255,0.03)', padding: '12px 16px', borderRadius: '8px' }}>
                      <span style={{ fontSize: '1.1rem', fontWeight: 500 }}>{coord.name}</span>
                      <a href={`tel:${coord.phone}`} className="flex items-center gap-2" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.9rem' }}>
                        <Phone size={14} /> {coord.phone}
                      </a>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            <div style={{ flex: '1 1 300px', minWidth: '300px' }}>
              <h3 style={{ color: 'var(--neon-purple)', fontSize: '1.5rem', marginBottom: '20px', borderBottom: '1px solid rgba(188,19,254,0.2)', paddingBottom: '10px' }}>
                Student Coordinators
              </h3>
              <div className="flex-col gap-4">
                {coordinators.students.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)' }}>No students recorded.</p>
                ) : (
                  coordinators.students.map((coord, idx) => (
                    <div key={idx} className="flex justify-between items-center" style={{ background: 'rgba(255,255,255,0.03)', padding: '12px 16px', borderRadius: '8px' }}>
                      <span style={{ fontSize: '1.1rem', fontWeight: 500 }}>{coord.name}</span>
                      <a href={`tel:${coord.phone}`} className="flex items-center gap-2" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.9rem' }}>
                        <Phone size={14} /> {coord.phone}
                      </a>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Basic Footer */}
      <footer style={{ marginTop: '60px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '40px', paddingBottom: '20px' }}>
        <div className="container flex-col items-center gap-4 text-muted" style={{ textAlign: 'center' }}>
          <p>© 2026 {siteSettings?.departmentName || "Department of AIML & CSE (AIML)"}. All rights reserved.</p>
        </div>
      </footer>

      <EventModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        event={selectedEvent} 
      />
    </div>
  );
};

export default LandingPage;
