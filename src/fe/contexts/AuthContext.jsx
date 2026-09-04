import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, googleProvider, db } from '@fe/config/firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // For Hackathon Demo Mode
  const setDemoUser = () => {
    setCurrentUser({
      uid: "demo_user_123",
      displayName: "Demo User",
      email: "demo@aranya.app",
      photoURL: "https://api.dicebear.com/9.x/notionists/svg?seed=Felix",
      isDemo: true
    });
  };

  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Strict rule: check if user exists in Firestore
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        await signOut(auth);
        throw new Error("Account not found. Please sign up first.");
      }
      
      return user;
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  const signupWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        // Create user document
        await setDoc(userRef, {
          name: user.displayName,
          email: user.email,
          photo_url: user.photoURL,
          total_scans: 0,
          unique_species_found: 0,
          badges_earned: [],
          points: 0,
          created_at: new Date().toISOString()
        });
      }
      
      return user;
    } catch (error) {
      console.error("Signup failed:", error);
      throw error;
    }
  };

  const logout = async () => {
    if (currentUser?.isDemo) {
      setCurrentUser(null);
    } else {
      await signOut(auth);
    }
  };

  useEffect(() => {
    // Only listen to Firebase auth state if we aren't using the Demo user.
    // If we are using Demo user, Firebase auth is ignored.
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // Don't overwrite the demo user with a null firebase user
      setCurrentUser((prev) => {
        if (prev?.isDemo) return prev;
        return user;
      });
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    loginWithGoogle,
    signupWithGoogle,
    setDemoUser,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
