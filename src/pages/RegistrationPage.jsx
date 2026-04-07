import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useFirebase } from '../context/FirebaseContext';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc, query, where, getDocs } from 'firebase/firestore';
import { ArrowLeft, Upload, AlertCircle } from 'lucide-react';

const DEPARTMENTS = ['CSE', 'AIML', 'CSE-AIML', 'CSE-ICB', 'CSE-DS', 'EEE', 'ECE', 'ISE', 'MECH', 'CIVIL'];
const SEMESTERS = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'];

const compressImage = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        let scaleSize = 1;
        if (img.width > MAX_WIDTH) {
          scaleSize = MAX_WIDTH / img.width;
        }
        canvas.width = img.width * scaleSize;
        canvas.height = img.height * scaleSize;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
    };
  });
};

const RegistrationPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { events, siteSettings } = useFirebase();

  const [formData, setFormData] = useState({
    name: '',
    usn: '',
    department: '',
    semester: '',
    mobile: '',
    eventId: eventId || '',
    teamSize: '2',
    teamMembers: [{ name: '', usn: '', department: '', semester: '' }],
    paymentScreenshot: null,
    paymentStatus: 'pending'
  });

  const [selectedEvent, setSelectedEvent] = useState(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dbQrCodeUrl, setDbQrCodeUrl] = useState('');
  const [dbUpiId, setDbUpiId] = useState('');

  useEffect(() => {
    const fetchMainSettings = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'config', 'siteSettings'));
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.qrcodeUrl) setDbQrCodeUrl(data.qrcodeUrl);
          if (data.upiId) setDbUpiId(data.upiId);
        }
      } catch (err) {
        console.error('Error fetching settings/main:', err);
      }
    };
    fetchMainSettings();
  }, []);
  useEffect(() => {
    if (formData.eventId && events && events.length > 0) {
      const ev = events.find(e => e.id === formData.eventId);
      if (ev) {
        setSelectedEvent(ev);
        let minSize = 2;
        if (ev.teamSize.includes('-')) {
          minSize = parseInt(ev.teamSize.split('-')[0]);
        } else {
          minSize = parseInt(ev.teamSize);
        }

        let initialMembers = [];
        for (let i = 0; i < minSize - 1; i++) {
          initialMembers.push({ name: '', usn: '', department: '', semester: '' });
        }
        setFormData(prev => ({ ...prev, teamSize: String(minSize), teamMembers: initialMembers }));
      }
    }
  }, [formData.eventId, events]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleTeamSizeChange = (e) => {
    const size = parseInt(e.target.value);
    const ev = events.find(event => event.id === formData.eventId);
    let max = 4;
    let min = 2;
    if (ev && ev.teamSize.includes('-')) {
      min = parseInt(ev.teamSize.split('-')[0]);
      max = parseInt(ev.teamSize.split('-')[1]);
    } else if (ev) {
      min = max = parseInt(ev.teamSize);
    }

    if (size >= min && size <= max) {
      const newMembers = [...formData.teamMembers];
      while (newMembers.length < size - 1) newMembers.push({ name: '', usn: '', department: '', semester: '' });
      while (newMembers.length > size - 1) newMembers.pop();
      setFormData({ ...formData, teamSize: String(size), teamMembers: newMembers });
    }
  };

  const handleMemberChange = (index, field, value) => {
    const newMembers = [...formData.teamMembers];
    newMembers[index][field] = value;
    setFormData({ ...formData, teamMembers: newMembers });
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];

      if (!validTypes.includes(file.type)) {
        setError('Only JPG or PNG images are allowed.');
        e.target.value = null;
        return;
      }

      setError('');
      setFormData({ ...formData, paymentScreenshot: file });
    }
  };

  const validateForm = () => {
    if (!formData.name || !formData.usn || !formData.department || !formData.semester || !formData.mobile || !formData.eventId) {
      setError('Please fill all basic details.');
      return false;
    }
    if (!formData.teamSize) {
      setError('Please select a team size.');
      return false;
    }
    for (let i = 0; i < formData.teamMembers.length; i++) {
      if (!formData.teamMembers[i].name || !formData.teamMembers[i].usn || !formData.teamMembers[i].department || !formData.teamMembers[i].semester) {
        setError(`Please fill all details (Name, USN, Department, Semester) for Team Member ${i + 2}.`);
        return false;
      }
    }
    if (!formData.paymentScreenshot) {
      setError('Please upload the payment screenshot.');
      return false;
    }
    return true;
  };

  const handleSubmitInit = (e) => {
    e.preventDefault();
    setError('');

    if (validateForm()) {
      submitToDatabase({ ...formData, paymentStatus: 'pending' });
    }
  };
  const submitToDatabase = async (finalData) => {
    setIsSubmitting(true);
    setError('');

    try {
      // 0. Prevent duplicate submissions
      const q = query(collection(db, 'registrations'), where('usn', '==', finalData.usn), where('eventId', '==', finalData.eventId));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        setError('A registration with this USN already exists for this event.');
        setIsSubmitting(false);
        return;
      }

      // 1. Compress screenshot to base64
      let base64Image = '';
      if (finalData.paymentScreenshot) {
        base64Image = await compressImage(finalData.paymentScreenshot);
      } else {
        setError('Payment screenshot is required.');
        setIsSubmitting(false);
        return;
      }

      const uniqueId = `REG-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      // 2. Save registration Document
      await addDoc(collection(db, 'registrations'), {
        registrationId: uniqueId,
        name: finalData.name,
        usn: finalData.usn,
        department: finalData.department,
        semester: finalData.semester,
        mobile: finalData.mobile,
        eventId: finalData.eventId,
        teamSize: parseInt(finalData.teamSize),
        teamMembers: finalData.teamMembers,
        paymentStatus: finalData.paymentStatus,
        paymentScreenshot: base64Image,
        timestamp: serverTimestamp()
      });

      setIsSubmitting(false);
      alert('Registration Successful! Your unique ID is: ' + uniqueId);
      navigate('/');
    } catch (err) {
      console.error(err);
      setError('Failed to submit registration to Firebase. Ensure config is correct. err: ' + err.message);
      setIsSubmitting(false);
    }
  };

  const eventOptions = events.map(e => <option key={e.id} value={e.id}>{e.title} (₹{e.price})</option>);

  const targetUpiId = dbUpiId || siteSettings?.upiId || 'armaandeepsingh440@okhdfcbank';
  const displayQrCode = dbQrCodeUrl || siteSettings?.qrcodeUrl || '';

  return (
    <div className="container" style={{ paddingTop: '60px', paddingBottom: '60px' }}>
      <Link to="/" className="flex items-center gap-2" style={{ color: 'var(--text-muted)', textDecoration: 'none', marginBottom: '30px', display: 'inline-flex' }}>
        <ArrowLeft size={20} /> Back to Home
      </Link>

      <div className="glass-card" style={{ maxWidth: '800px', margin: '0 auto', padding: '40px' }}>
        <h1 className="text-gradient" style={{ fontSize: '2.5rem', marginBottom: '10px', textAlign: 'center' }}>Event Registration</h1>
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginBottom: '40px' }}>Fill in the details to secure your spot</p>

        {error && (
          <div style={{ background: 'rgba(255, 51, 102, 0.1)', border: '1px solid var(--error)', color: 'var(--error)', padding: '16px', borderRadius: '8px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertCircle size={20} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmitInit} className="flex-col gap-6">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label className="input-label">Select Event</label>
              <select name="eventId" value={formData.eventId} onChange={handleInputChange} className="input-field">
                <option value="">-- Choose an Event --</option>
                {eventOptions}
              </select>
            </div>
            {selectedEvent && (
              <div>
                <label className="input-label">Event Price</label>
                <div style={{ padding: '12px 16px', background: 'rgba(0,0,0,0.5)', borderRadius: '8px', color: 'var(--neon-green)', fontWeight: 600 }}>
                  ₹{selectedEvent.price}
                </div>
              </div>
            )}
          </div>

          <div style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h3 style={{ color: 'var(--neon-blue)', marginBottom: '20px', fontSize: '1.2rem' }}>Leader Details</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div><label className="input-label">Full Name</label><input type="text" name="name" value={formData.name} onChange={handleInputChange} className="input-field" placeholder="John Doe" /></div>
              <div><label className="input-label">USN</label><input type="text" name="usn" value={formData.usn} onChange={handleInputChange} className="input-field" placeholder="1XY23CS001" /></div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
              <div>
                <label className="input-label">Department</label>
                <select name="department" value={formData.department} onChange={handleInputChange} className="input-field">
                  <option value="">Select Dept</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="input-label">Semester</label>
                <select name="semester" value={formData.semester} onChange={handleInputChange} className="input-field">
                  <option value="">Select Sem</option>
                  {SEMESTERS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div><label className="input-label">Mobile</label><input type="tel" name="mobile" value={formData.mobile} onChange={handleInputChange} className="input-field" placeholder="9876543210" /></div>
            </div>
          </div>

          <div style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="flex justify-between items-center" style={{ marginBottom: '20px' }}>
              <h3 style={{ color: 'var(--neon-purple)', fontSize: '1.2rem' }}>Team Details</h3>
              {selectedEvent && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <label className="input-label" style={{ margin: 0 }}>Team Size (Allowed: {selectedEvent.teamSize}):</label>
                  <select
                    name="teamSize"
                    value={formData.teamSize}
                    onChange={handleTeamSizeChange}
                    className="input-field"
                    style={{ width: '150px', padding: '6px', appearance: 'auto' }}
                  >
                    {[2, 3, 4].map(size => {
                      let isDisabled = false;
                      if (selectedEvent && selectedEvent.teamSize) {
                        let min = 2, max = 4;
                        if (String(selectedEvent.teamSize).includes('-')) {
                          min = parseInt(String(selectedEvent.teamSize).split('-')[0]);
                          max = parseInt(String(selectedEvent.teamSize).split('-')[1]);
                        } else {
                          min = max = parseInt(selectedEvent.teamSize);
                        }
                        isDisabled = size < min || size > max;
                      }
                      return (
                        <option key={size} value={size} disabled={isDisabled}>
                          {size} Members
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}
            </div>

            <div className="flex-col gap-4">
              {formData.teamMembers.map((member, index) => (
                <div key={index} style={{ display: 'grid', gap: '20px', padding: '16px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div><label className="input-label">Member {index + 2} Name</label><input type="text" value={member.name} onChange={(e) => handleMemberChange(index, 'name', e.target.value)} className="input-field" /></div>
                    <div><label className="input-label">Member {index + 2} USN</label><input type="text" value={member.usn} onChange={(e) => handleMemberChange(index, 'usn', e.target.value)} className="input-field" /></div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div>
                      <label className="input-label">Member {index + 2} Department</label>
                      <select value={member.department} onChange={(e) => handleMemberChange(index, 'department', e.target.value)} className="input-field">
                        <option value="">Select Dept</option>
                        {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="input-label">Member {index + 2} Semester</label>
                      <select value={member.semester} onChange={(e) => handleMemberChange(index, 'semester', e.target.value)} className="input-field">
                        <option value="">Select Sem</option>
                        {SEMESTERS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h3 style={{ color: 'var(--neon-gold)', marginBottom: '20px', fontSize: '1.2rem' }}>Payment Proof (Manual UPI)</h3>
            {selectedEvent && (
              <div style={{ marginBottom: '20px', padding: '20px', background: 'rgba(255, 215, 0, 0.05)', borderRadius: '8px', border: '1px solid rgba(255, 215, 0, 0.2)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <p style={{ color: 'var(--text-main)', fontSize: '1.2rem', marginBottom: '16px' }}>
                  Amount to Pay: <strong style={{ color: 'var(--neon-green)' }}>₹{selectedEvent.price}</strong>
                </p>

                <h4 style={{ color: 'var(--neon-blue)', marginBottom: '12px', fontSize: '1.1rem', letterSpacing: '1px', textTransform: 'uppercase' }}>
                  Scan to Pay
                </h4>

                <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginBottom: '16px' }}>
                  UPI ID: <strong style={{ color: 'var(--neon-gold)' }}>{targetUpiId}</strong>
                </p>

                {displayQrCode ? (
                  <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', marginBottom: '16px', boxShadow: '0 0 25px rgba(255, 215, 0, 0.2)', width: '100%', maxWidth: '200px', aspectRatio: '1/1' }}>
                    <img src={displayQrCode} alt="UPI QR Code for Payment" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
                  </div>
                ) : (
                  <div style={{ padding: '20px', color: 'var(--text-muted)', border: '1px dashed rgba(255,255,255,0.2)', borderRadius: '8px', marginBottom: '16px', width: '100%', maxWidth: '250px' }}>
                    <p style={{ fontSize: '0.9rem' }}>Waiting for Admin to set up QR Code.</p>
                  </div>
                )}

                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '12px', maxWidth: '300px' }}>
                  Scan QR or pay via UPI ID, then upload your payment success screenshot below.
                </p>
              </div>
            )}

            <label style={{ display: 'block', width: '100%', padding: '40px 20px', border: '2px dashed rgba(255,215,0,0.3)', borderRadius: '12px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.3s' }} className="upload-box hover:bg-white/5">
              <Upload size={32} color="var(--neon-gold)" style={{ margin: '0 auto 10px' }} />
              <div>{formData.paymentScreenshot ? formData.paymentScreenshot.name : 'Click to Upload Screenshot (Image only)'}</div>
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
            </label>

            {formData.paymentScreenshot && (
              <div style={{ marginTop: '20px', textAlign: 'center' }}>
                <img src={URL.createObjectURL(formData.paymentScreenshot)} alt="Proof" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px', border: '1px solid rgba(255,215,0,0.5)' }} />
              </div>
            )}
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '16px', fontSize: '1.2rem' }} disabled={isSubmitting}>
            {isSubmitting ? 'Processing...' : 'Submit Registration'}
          </button>
        </form>
      </div>


    </div>
  );
};

export default RegistrationPage;
