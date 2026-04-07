import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, User, Code2, LogIn, LogOut } from 'lucide-react';
import { useFirebase } from '../context/FirebaseContext';

const Navbar = () => {
  const { user, loginWithGoogle, logout } = useFirebase();

  return (
    <nav className="glass" style={{
      position: 'fixed',
      top: 0,
      width: '100%',
      zIndex: 100,
      padding: '15px 0',
      borderTop: 'none',
      borderLeft: 'none',
      borderRight: 'none',
      borderRadius: 0
    }}>
      <div className="container flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2" style={{ textDecoration: 'none' }}>
          <Code2 color="var(--neon-blue)" size={28} />
          <span style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'Outfit' }} className="text-gradient">
            AIML Events
          </span>
        </Link>
        
        <div className="flex gap-6 items-center">
          <a href="/#events" style={{ color: 'var(--text-main)', textDecoration: 'none', fontWeight: 500, transition: 'color 0.3s' }} 
             onMouseOver={(e) => e.target.style.color = 'var(--neon-blue)'}
             onMouseOut={(e) => e.target.style.color = 'var(--text-main)'}>
             Events
          </a>
          <a href="/#coordinators" style={{ color: 'var(--text-main)', textDecoration: 'none', fontWeight: 500, transition: 'color 0.3s' }}
             onMouseOver={(e) => e.target.style.color = 'var(--neon-purple)'}
             onMouseOut={(e) => e.target.style.color = 'var(--text-main)'}>
             Coordinators
          </a>
          {user ? (
            <>
              <Link to="/admin" className="btn btn-outline flex items-center gap-2" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
                <User size={16} /> Admin
              </Link>
              <button onClick={logout} className="btn flex items-center gap-2" style={{ padding: '8px 16px', fontSize: '0.9rem', background: 'transparent', border: '1px solid var(--error)', color: 'var(--error)' }}>
                <LogOut size={16} /> Logout
              </button>
            </>
          ) : (
            <button onClick={async () => {
              const res = await loginWithGoogle();
              if (!res.success) {
                alert("Login Failed: " + res.error);
              }
            }} className="btn btn-primary flex items-center gap-2" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
              <LogIn size={16} /> Login
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
