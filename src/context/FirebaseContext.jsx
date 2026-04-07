import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db, provider } from '../firebase';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut 
} from 'firebase/auth';
import { 
  collection, 
  onSnapshot, 
  doc, 
  getDoc,
  query,
  where
} from 'firebase/firestore';

const FirebaseContext = createContext();

export const useFirebase = () => useContext(FirebaseContext);

export const FirebaseProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [events, setEvents] = useState([]);
  const [coordinators, setCoordinators] = useState({ faculty: [], students: [] });
  const [siteSettings, setSiteSettings] = useState({
    departmentName: 'Department of AIML & CSE (AIML)',
    associationName: 'PAIthon Association',
    subtitle: 'Presents Technical Events — The Future of AI'
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Authentication
  useEffect(() => {
    // If Firebase is not configured properly, this might throw. We wrap it cautiously.
    try {
      const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        const allowedEmail = import.meta.env.VITE_ADMIN_EMAIL;
        // Block all other users from being 'logged in' if they bypass login form somehow
        if (currentUser && allowedEmail && currentUser.email !== allowedEmail) {
          signOut(auth);
          setUser(null);
        } else {
          setUser(currentUser);
        }
      });
      return () => unsubscribe();
    } catch (err) {
      console.warn("Firebase Auth Error: Please check your Firebase config keys.", err);
      setUser(null);
    }
  }, []);

  // Fetch Firestore Data (Real-time)
  useEffect(() => {
    try {
      // 1. Events (Only visible ones for public, but Admin might want all. For now, fetch visible)
      let eventsQuery = collection(db, 'events');
      if (!user) { // If not admin, only fetch visible
        eventsQuery = query(collection(db, 'events'), where('visible', '==', true));
      }
      
      const unsubEvents = onSnapshot(eventsQuery, (snapshot) => {
        const eventsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setEvents(eventsData);
      }, (err) => {
        console.error("Error fetching events:", err);
        setError('Failed to load events.');
      });

      // 2. Coordinators
      const unsubCoords = onSnapshot(collection(db, 'coordinators'), (snapshot) => {
        const faculty = [];
        const students = [];
        snapshot.docs.forEach(doc => {
          const data = { id: doc.id, ...doc.data() };
          if (data.type === 'faculty') faculty.push(data);
          if (data.type === 'student') students.push(data);
        });
        setCoordinators({ faculty, students });
      }, (err) => {
         console.error("Error fetching coordinators:", err);
      });

      // 3. Settings
      const unsubSettings = onSnapshot(doc(db, 'config', 'siteSettings'), (docSnap) => {
        if (docSnap.exists()) {
          setSiteSettings(prev => ({ ...prev, ...docSnap.data() }));
        }
      }, (err) => {
        console.error("Error fetching settings:", err);
      });

      // 4. Main Settings (QR Code)
      const unsubMainSettings = onSnapshot(doc(db, 'settings', 'main'), (docSnap) => {
        if (docSnap.exists() && docSnap.data().qrcodeUrl) {
          setSiteSettings(prev => ({ ...prev, qrcodeUrl: docSnap.data().qrcodeUrl }));
        }
      }, (err) => {
        console.error("Error fetching main settings:", err);
      });

      // Loading state ends after initial fetch setup
      setLoading(false);

      return () => {
        unsubEvents();
        unsubCoords();
        unsubSettings();
        unsubMainSettings();
      };
    } catch (err) {
      console.warn("Firestore Setup Error: Please check config.", err);
      setLoading(false);
      setError("Firebase not configured. Please add .env variables.");
    }
  }, [user]);

  // Auth Helpers
  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const currentUser = result.user;
      const allowedEmail = import.meta.env.VITE_ADMIN_EMAIL;
      
      if (allowedEmail && currentUser.email !== allowedEmail) {
        await signOut(auth);
        return { success: false, error: "Access Denied. You are not an authorized admin." };
      }
      return { success: true };
    } catch (err) {
      if (err.code === 'auth/popup-closed-by-user') {
        return { success: false, error: 'Login popup was closed.' };
      }
      return { success: false, error: err.message };
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error(err);
    }
  };

  const value = {
    user,
    events,
    coordinators,
    siteSettings,
    loading,
    error,
    loginWithGoogle,
    logout
  };

  return (
    <FirebaseContext.Provider value={value}>
      {children}
    </FirebaseContext.Provider>
  );
};
