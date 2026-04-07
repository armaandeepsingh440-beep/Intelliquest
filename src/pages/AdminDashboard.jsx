import React, { useState, useEffect } from 'react';
import { Calendar, Users, Settings, LogOut, Check, X, Search, Download, Plus, Edit2, Trash2, Eye, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useFirebase } from '../context/FirebaseContext';
import { db, storage } from '../firebase';
import { collection, onSnapshot, doc, getDoc, setDoc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('events'); 
  const { user, loginWithGoogle, logout, siteSettings } = useFirebase();
  const navigate = useNavigate();

  // Admin Data State
  const [adminEvents, setAdminEvents] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [adminCoordinators, setAdminCoordinators] = useState([]);
  const [localSettings, setLocalSettings] = useState({ departmentName: '', associationName: '', subtitle: '', upiId: 'armaandeepsingh440@okhdfcbank', qrcodeUrl: '' });
  const [qrCodeFile, setQrCodeFile] = useState(null);

  // Forms & Modals State
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [eventForm, setEventForm] = useState({ title: '', description: '', rules: '', date: '', price: 0, teamSize: '1', visible: true });

  const [isCoordinatorModalOpen, setIsCoordinatorModalOpen] = useState(false);
  const [editingCoordinator, setEditingCoordinator] = useState(null);
  const [coordinatorForm, setCoordinatorForm] = useState({ name: '', phone: '', type: 'student' });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEvent, setFilterEvent] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  
  const [viewingImage, setViewingImage] = useState(null);

  useEffect(() => {
    if (user) {
      // Fetch all events
      const unsubEvents = onSnapshot(collection(db, 'events'), (snap) => setAdminEvents(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
      // Fetch all registrations
      const unsubRegs = onSnapshot(collection(db, 'registrations'), (snap) => setRegistrations(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
      // Fetch all coords
      const unsubCoords = onSnapshot(collection(db, 'coordinators'), (snap) => setAdminCoordinators(snap.docs.map(d => ({ id: d.id, ...d.data() }))));

      return () => { unsubEvents(); unsubRegs(); unsubCoords(); };
    }
  }, [user]);

  useEffect(() => {
    if (siteSettings) {
      setLocalSettings({
        departmentName: siteSettings.departmentName || '',
        associationName: siteSettings.associationName || '',
        subtitle: siteSettings.subtitle || '',
        upiId: siteSettings.upiId || 'armaandeepsingh440@okhdfcbank',
        qrcodeUrl: siteSettings.qrcodeUrl || ''
      });
    }
  }, [siteSettings]);

  const handleLogin = async () => {
    const res = await loginWithGoogle();
    if (!res.success) {
      alert('Login Failed: ' + res.error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const saveEvent = async (e) => {
    e.preventDefault();
    try {
      if (editingEvent) {
        await updateDoc(doc(db, 'events', editingEvent.id), eventForm);
      } else {
        await addDoc(collection(db, 'events'), eventForm);
      }
      setIsEventModalOpen(false);
      setEditingEvent(null);
    } catch (err) {
      alert("Error saving event: " + err.message);
    }
  };

  const deleteCurrentEvent = async (id) => {
    if (window.confirm("Delete this event?")) {
      await deleteDoc(doc(db, 'events', id));
    }
  };

  const verifyPayment = async (id) => {
    try {
      await updateDoc(doc(db, 'registrations', id), { paymentStatus: 'verified' });
    } catch (err) {
      alert("Error verifying payment: " + err.message);
    }
  };

  const openEventModal = (ev = null) => {
    if (ev) {
      setEditingEvent(ev);
      setEventForm(ev);
    } else {
      setEditingEvent(null);
      setEventForm({ title: '', description: '', rules: '', date: '', price: 0, teamSize: '1', visible: true });
    }
    setIsEventModalOpen(true);
  };

  const saveCoordinator = async (e) => {
    e.preventDefault();
    try {
      if (editingCoordinator) {
        await updateDoc(doc(db, 'coordinators', editingCoordinator.id), coordinatorForm);
      } else {
        await addDoc(collection(db, 'coordinators'), coordinatorForm);
      }
      setIsCoordinatorModalOpen(false);
      setEditingCoordinator(null);
    } catch (err) {
      alert("Error saving coordinator: " + err.message);
    }
  };

  const deleteCurrentCoordinator = async (id) => {
    if (window.confirm("Delete this coordinator?")) {
      await deleteDoc(doc(db, 'coordinators', id));
    }
  };

  const openCoordinatorModal = (coord = null) => {
    if (coord) {
      setEditingCoordinator(coord);
      setCoordinatorForm(coord);
    } else {
      setEditingCoordinator(null);
      setCoordinatorForm({ name: '', phone: '', type: 'student' });
    }
    setIsCoordinatorModalOpen(true);
  };

  const saveSettings = async () => {
    try {
      let finalSettings = { ...localSettings };
      let finalMainSettings = {
        upiId: localSettings.upiId || 'armaandeepsingh440@okhdfcbank'
      };
      
      if (qrCodeFile) {
        const storageRef = ref(storage, `qrCodes/${Date.now()}_${qrCodeFile.name}`);
        const snapshot = await uploadBytes(storageRef, qrCodeFile);
        const downloadURL = await getDownloadURL(snapshot.ref);
        finalSettings.qrcodeUrl = downloadURL;
        finalMainSettings.qrcodeUrl = downloadURL;
      }
      
      await setDoc(doc(db, 'config', 'siteSettings'), finalSettings, { merge: true });
      await setDoc(doc(db, 'settings', 'main'), finalMainSettings, { merge: true });
      
      alert("Settings saved successfully.");
      setQrCodeFile(null);
    } catch (err) {
      console.error("Save error:", err);
      alert("Error saving settings: " + err.message);
    }
  };

  const filteredRegistrations = registrations.filter(r => {
    const matchSearch = (r.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || (r.usn || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchEvent = filterEvent === 'all' || r.eventId === filterEvent;
    const matchStatus = filterStatus === 'all' || (r.paymentStatus || 'pending') === filterStatus;
    return matchSearch && matchEvent && matchStatus;
  });

  const exportCSV = () => {
    const headers = ['RegID', 'Name', 'USN', 'Department', 'Semester', 'Mobile', 'EventTitle', 'TeamSize', 'Status', 'Date', 'Team Members'];
    const rows = filteredRegistrations.map(r => {
      const teamDetails = (r.teamMembers || []).map(m => `${m.name} (${m.usn} - ${m.department} Sem ${m.semester})`).join(' | ');
      return [
        r.registrationId || '-', r.name || 'N/A', r.usn || 'N/A', r.department || 'N/A', r.semester || '-', r.mobile || 'N/A',
        adminEvents.find(e => e.id === r.eventId)?.title || r.eventId || 'Unknown',
        r.teamSize || '1', r.paymentStatus || 'pending', r.timestamp?.seconds ? new Date(r.timestamp.seconds * 1000).toLocaleString() : '-',
        `"${teamDetails}"`
      ];
    });
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `registrations_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  if (!user) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-dark)' }}>
        <div className="glass-card" style={{ padding: '40px', width: '100%', maxWidth: '400px' }}>
          <h2 className="text-gradient" style={{ textAlign: 'center', marginBottom: '10px', fontSize: '2rem' }}>Admin Access</h2>
          <p style={{ textAlign: 'center', marginBottom: '30px', color: 'var(--text-muted)' }}>Authorized personnel only</p>
          <div className="flex-col gap-4">
            <button onClick={handleLogin} className="btn btn-primary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25C22.56 11.47 22.49 10.72 22.36 10H12V14.26H17.92C17.67 15.63 16.86 16.79 15.7 17.57V20.34H19.26C21.34 18.42 22.56 15.6 22.56 12.25Z" fill="#4285F4"/>
                <path d="M12 23.0001C14.97 23.0001 17.46 22.0201 19.26 20.3401L15.7 17.5701C14.73 18.2201 13.48 18.6201 12 18.6201C9.14 18.6201 6.7 16.6901 5.84 14.1001H2.18V16.9401C3.99 20.5301 7.7 23.0001 12 23.0001Z" fill="#34A853"/>
                <path d="M5.84 14.1C5.62 13.45 5.5 12.74 5.5 12C5.5 11.26 5.62 10.55 5.84 9.9V7.06H2.18C1.43 8.55 1 10.22 1 12C1 13.78 1.43 15.45 2.18 16.94L5.84 14.1Z" fill="#FBBC05"/>
                <path d="M12 5.38C13.62 5.38 15.06 5.93 16.21 7.02L19.34 3.89C17.45 2.13 14.97 1 12 1C7.7 1 3.99 3.47 2.18 7.06L5.84 9.9C6.7 7.31 9.14 5.38 12 5.38Z" fill="#EA4335"/>
              </svg>
              Login with Google
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard Layout
  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg-dark)', color: 'var(--text-main)' }}>
      {/* Sidebar */}
      <div style={{ width: '250px', background: 'rgba(20,20,30,0.8)', borderRight: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid var(--glass-border)' }}>
          <h2 className="text-gradient" style={{ fontSize: '1.5rem', margin: 0 }}>AIML Admin</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Event Management</p>
        </div>
        
        <div style={{ padding: '20px 10px', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
          <button onClick={() => setActiveTab('events')} className={`btn ${activeTab === 'events' ? 'btn-primary' : 'btn-outline'}`} style={{ width: '100%', justifyContent: 'flex-start', border: 'none' }}>
            <Calendar size={18} style={{ marginRight: '10px' }} /> Manage Events
          </button>
          <button onClick={() => setActiveTab('registrations')} className={`btn ${activeTab === 'registrations' ? 'btn-primary' : 'btn-outline'}`} style={{ width: '100%', justifyContent: 'flex-start', border: 'none' }}>
            <Users size={18} style={{ marginRight: '10px' }} /> Registrations
          </button>
          <button onClick={() => setActiveTab('settings')} className={`btn ${activeTab === 'settings' ? 'btn-primary' : 'btn-outline'}`} style={{ width: '100%', justifyContent: 'flex-start', border: 'none' }}>
            <Settings size={18} style={{ marginRight: '10px' }} /> Site Settings
          </button>
          <button onClick={() => setActiveTab('coordinators')} className={`btn ${activeTab === 'coordinators' ? 'btn-primary' : 'btn-outline'}`} style={{ width: '100%', justifyContent: 'flex-start', border: 'none' }}>
            <UserPlus size={18} style={{ marginRight: '10px' }} /> Coordinators
          </button>
        </div>

        <div style={{ padding: '20px' }}>
          <button onClick={handleLogout} className="btn w-full" style={{ background: 'rgba(255,51,102,0.1)', color: 'var(--error)' }}>
            <LogOut size={18} style={{ marginRight: '10px' }} /> Logout
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '30px' }}>
        {activeTab === 'events' && (
          <div className="animate-fade-in">
            <div className="flex justify-between items-center" style={{ marginBottom: '30px' }}>
              <h1 style={{ fontSize: '2rem' }}>Manage Events</h1>
              <button className="btn btn-primary flex items-center gap-2" onClick={() => openEventModal()}><Plus size={18} /> Add New Event</button>
            </div>
            
            <div className="flex-col gap-4">
              {adminEvents.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>No events created yet.</p> : null}
              {adminEvents.map(event => (
                <div key={event.id} className="glass" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: event.visible !== false ? 1 : 0.6 }}>
                  <div>
                    <h3 style={{ fontSize: '1.2rem', color: 'var(--neon-blue)', marginBottom: '4px' }}>
                      {event.title || 'Untitled Event'} {event.visible === false && <span style={{ fontSize: '0.8rem', color: 'var(--error)', border: '1px solid var(--error)', padding: '2px 6px', borderRadius: '4px', marginLeft: '10px' }}>Hidden</span>}
                    </h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{event.date || 'No Date'} • ₹{event.price || 0} • Teams: {event.teamSize || '1'}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openEventModal(event)} className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '0.9rem' }}><Edit2 size={14} /></button>
                    <button onClick={() => deleteCurrentEvent(event.id)} className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '0.9rem', color: 'var(--error)', borderColor: 'var(--error)' }}><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'registrations' && (
          <div className="animate-fade-in">
            <div className="flex justify-between items-center" style={{ marginBottom: '20px' }}>
              <h1 style={{ fontSize: '2rem' }}>Registration Data</h1>
              <button onClick={exportCSV} className="btn btn-gold flex items-center gap-2"><Download size={18} /> Export CSV</button>
            </div>
            
            <div className="glass-card flex gap-4" style={{ padding: '15px 20px', marginBottom: '20px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <div className="flex items-center gap-2" style={{ background: 'rgba(0,0,0,0.3)', padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                  <Search size={16} color="var(--text-muted)" />
                  <input type="text" placeholder="Search by Name or USN..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', width: '100%', outline: 'none' }} />
                </div>
              </div>
              <select value={filterEvent} onChange={e => setFilterEvent(e.target.value)} className="input-field" style={{ width: 'auto', minWidth: '150px' }}>
                <option value="all">All Events</option>
                {adminEvents.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
              </select>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="input-field" style={{ width: 'auto', minWidth: '150px' }}>
                <option value="all">All Statuses</option>
                <option value="verified">Verified</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            <div className="glass" style={{ overflow: 'hidden' }}>
              {filteredRegistrations.length === 0 ? (
                <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>No registrations match your criteria.</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
                  <thead style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <tr>
                      <th style={{ padding: '16px', borderBottom: '1px solid var(--glass-border)' }}>Participant</th>
                      <th style={{ padding: '16px', borderBottom: '1px solid var(--glass-border)' }}>Details</th>
                      <th style={{ padding: '16px', borderBottom: '1px solid var(--glass-border)' }}>Event</th>
                      <th style={{ padding: '16px', borderBottom: '1px solid var(--glass-border)' }}>Status</th>
                      <th style={{ padding: '16px', borderBottom: '1px solid var(--glass-border)' }}>Proof & Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRegistrations.map(r => (
                      <tr key={r.id}>
                        <td style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          {r.name || 'Unknown'}
                          {r.registrationId && <br/>}
                          {r.registrationId && <span style={{ fontSize: '0.75rem', color: 'var(--neon-blue)' }}>{r.registrationId}</span>}
                          <br/><span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{r.mobile || 'No Mobile'}</span>
                        </td>
                        <td style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <div style={{ marginBottom: '8px' }}>
                            <strong>Leader:</strong> {r.usn || 'No USN'} - {r.department || 'N/A'} (Sem {r.semester || '-'})
                          </div>
                          {r.teamMembers && r.teamMembers.length > 0 && (
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '8px', marginTop: '8px' }}>
                              <strong style={{ color: 'var(--neon-blue)' }}>Team ({r.teamSize}):</strong>
                              {r.teamMembers.map((m, i) => (
                                <div key={i} style={{ marginTop: '4px' }}>
                                  • {m.name} ({m.usn}) - {m.department} Sem {m.semester}
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{adminEvents.find(e => e.id === r.eventId)?.title || r.eventId || 'Unknown Event'}</td>
                        <td style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <span style={{ 
                            padding: '4px 8px', 
                            borderRadius: '12px', 
                            fontSize: '0.8rem',
                            background: r.paymentStatus === 'verified' ? 'rgba(0, 255, 136, 0.1)' : 'rgba(255, 215, 0, 0.1)',
                            color: r.paymentStatus === 'verified' ? 'var(--success)' : 'var(--neon-gold)'
                          }}>
                            {(r.paymentStatus || 'PENDING').toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '10px', alignItems: 'center' }}>
                          {(r.paymentScreenshot || r.paymentScreenshotUrl) ? (
                            <img src={r.paymentScreenshot || r.paymentScreenshotUrl} alt="Payment Proof" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer' }} onClick={() => setViewingImage(r.paymentScreenshot || r.paymentScreenshotUrl)} title="Click to view full size" />
                          ) : <span style={{ color: 'var(--text-muted)' }}>No Image</span>}

                          {r.paymentStatus === 'pending' && (
                            <button onClick={() => verifyPayment(r.id)} className="btn btn-primary flex items-center gap-1" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                              <Check size={14}/> Verify
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {activeTab === 'coordinators' && (
          <div className="animate-fade-in">
            <div className="flex justify-between items-center" style={{ marginBottom: '30px' }}>
              <h1 style={{ fontSize: '2rem' }}>Manage Coordinators</h1>
              <button className="btn btn-primary flex items-center gap-2" onClick={() => openCoordinatorModal()}><Plus size={18} /> Add Coordinator</button>
            </div>
            
            <div className="flex-col gap-4">
              {adminCoordinators.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>No coordinators exist.</p> : null}
              {adminCoordinators.map(coord => (
                <div key={coord.id} className="glass" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ fontSize: '1.2rem', color: coord.type === 'faculty' ? 'var(--neon-blue)' : 'var(--neon-purple)', marginBottom: '4px' }}>
                      {coord.name || 'Unknown'} <span style={{ fontSize: '0.8rem', opacity: 0.8, background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '12px', marginLeft: '10px' }}>{(coord.type || 'STUDENT').toUpperCase()}</span>
                    </h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Phone: {coord.phone || 'N/A'}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openCoordinatorModal(coord)} className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '0.9rem' }}><Edit2 size={14} /></button>
                    <button onClick={() => deleteCurrentCoordinator(coord.id)} className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '0.9rem', color: 'var(--error)', borderColor: 'var(--error)' }}><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="animate-fade-in">
            <h1 style={{ fontSize: '2rem', marginBottom: '30px' }}>Site Settings</h1>
            <div className="glass-card" style={{ padding: '30px', maxWidth: '600px' }}>
              <div className="flex-col gap-6">
                <div>
                  <label className="input-label">Department Name</label>
                  <input type="text" value={localSettings.departmentName} onChange={e => setLocalSettings({...localSettings, departmentName: e.target.value})} className="input-field" />
                </div>
                <div>
                  <label className="input-label">Association Name</label>
                  <input type="text" value={localSettings.associationName} onChange={e => setLocalSettings({...localSettings, associationName: e.target.value})} className="input-field" />
                </div>
                <div>
                  <label className="input-label">Subtitle Text</label>
                  <input type="text" value={localSettings.subtitle} onChange={e => setLocalSettings({...localSettings, subtitle: e.target.value})} className="input-field" />
                </div>
                <div>
                  <label className="input-label">UPI ID for Payments</label>
                  <input type="text" value={localSettings.upiId} onChange={e => setLocalSettings({...localSettings, upiId: e.target.value})} className="input-field" placeholder="armaandeepsingh440@okhdfcbank" />
                </div>
                <div>
                  <label className="input-label">Custom QR Code Image</label>
                  <input type="file" accept="image/*" onChange={e => { if(e.target.files[0]) setQrCodeFile(e.target.files[0]) }} className="input-field" style={{ padding: '10px' }} />
                  {(qrCodeFile || localSettings.qrcodeUrl) && (
                    <div style={{ marginTop: '10px' }}>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '5px' }}>Current QR Preview:</p>
                      <img src={qrCodeFile ? URL.createObjectURL(qrCodeFile) : localSettings.qrcodeUrl} alt="QR Preview" style={{ maxWidth: '150px', borderRadius: '8px', border: '1px solid var(--glass-border)' }} />
                    </div>
                  )}
                </div>
                <hr style={{ border: 'none', borderTop: '1px solid var(--glass-border)' }} />
                <button onClick={saveSettings} className="btn btn-primary" style={{ width: '100%' }}>Save Site Settings</button>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Add / Edit Event Modal */}
      {isEventModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-card flex-col gap-4" style={{ padding: '40px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="flex justify-between items-center" style={{ marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.5rem' }}>{editingEvent ? 'Edit Event' : 'Create Event'}</h2>
              <button onClick={() => setIsEventModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer' }}><X size={24} /></button>
            </div>
            
            <form onSubmit={saveEvent} className="flex-col gap-4">
              <div><label className="input-label">Title</label><input type="text" required value={eventForm.title} onChange={e => setEventForm({...eventForm, title: e.target.value})} className="input-field" /></div>
              <div><label className="input-label">Description</label><textarea required value={eventForm.description} onChange={e => setEventForm({...eventForm, description: e.target.value})} className="input-field" style={{ minHeight: '80px' }}></textarea></div>
              <div><label className="input-label">Rules (HTML or Line text)</label><textarea required value={eventForm.rules} onChange={e => setEventForm({...eventForm, rules: e.target.value})} className="input-field" style={{ minHeight: '80px' }}></textarea></div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div><label className="input-label">Date</label><input type="text" required value={eventForm.date} onChange={e => setEventForm({...eventForm, date: e.target.value})} className="input-field" placeholder="e.g. April 15, 2026" /></div>
                <div><label className="input-label">Price (₹)</label><input type="number" required value={eventForm.price} onChange={e => setEventForm({...eventForm, price: Number(e.target.value)})} className="input-field" /></div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div><label className="input-label">Team Size</label><input type="text" required value={eventForm.teamSize} onChange={e => setEventForm({...eventForm, teamSize: e.target.value})} className="input-field" placeholder="e.g. 2-4" /></div>
                <div className="flex items-center gap-2" style={{ marginTop: '24px' }}>
                  <input type="checkbox" checked={eventForm.visible} onChange={e => setEventForm({...eventForm, visible: e.target.checked})} />
                  <label className="input-label" style={{ margin: 0 }}>Visible to Public</label>
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ marginTop: '20px' }}>{editingEvent ? 'Update Event' : 'Create Event'}</button>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Coordinator Modal */}
      {isCoordinatorModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-card flex-col gap-4" style={{ padding: '40px', width: '100%', maxWidth: '500px' }}>
            <div className="flex justify-between items-center" style={{ marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.5rem' }}>{editingCoordinator ? 'Edit Coordinator' : 'Add Coordinator'}</h2>
              <button onClick={() => setIsCoordinatorModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer' }}><X size={24} /></button>
            </div>
            
            <form onSubmit={saveCoordinator} className="flex-col gap-4">
              <div><label className="input-label">Name</label><input type="text" required value={coordinatorForm.name} onChange={e => setCoordinatorForm({...coordinatorForm, name: e.target.value})} className="input-field" placeholder="Prof. Jane Doe" /></div>
              <div><label className="input-label">Phone Prefix/Number</label><input type="text" required value={coordinatorForm.phone} onChange={e => setCoordinatorForm({...coordinatorForm, phone: e.target.value})} className="input-field" placeholder="+91 9876543210" /></div>
              <div>
                <label className="input-label">Coordinator Type</label>
                <select value={coordinatorForm.type} onChange={e => setCoordinatorForm({...coordinatorForm, type: e.target.value})} className="input-field">
                  <option value="student">Student</option>
                  <option value="faculty">Faculty</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary" style={{ marginTop: '20px' }}>{editingCoordinator ? 'Update Coordinator' : 'Save Coordinator'}</button>
            </form>
          </div>
        </div>
      )}

      {/* Image Viewer Modal */}
      {viewingImage && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.9)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setViewingImage(null)}>
          <button onClick={() => setViewingImage(null)} style={{ position: 'absolute', top: '20px', right: '30px', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: '10px', borderRadius: '50%', cursor: 'pointer', zIndex: 2001 }}>
            <X size={24} />
          </button>
          <img src={viewingImage} alt="Payment Screenshot Full" style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 0 30px rgba(0,0,0,0.5)' }} onClick={e => e.stopPropagation()} />
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
