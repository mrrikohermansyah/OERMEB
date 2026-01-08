// firebase.js
// Import Firebase SDKs (using CDN for simplicity as requested "Modular JS structure" but without bundler requirement implied by "Siap deploy ke GitHub Pages" easily)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// TODO: Replace with your actual Firebase project config
const firebaseConfig = {
  apiKey: "AIzaSyAjEqGntQTE9NbHSunAzZ7hQCjuZ7btFVk",
  authDomain: "oermeb-23da9.firebaseapp.com",
  projectId: "oermeb-23da9",
  storageBucket: "oermeb-23da9.firebasestorage.app",
  messagingSenderId: "720308566530",
  appId: "1:720308566530:web:c1021722e87bd47f53851b",
  measurementId: "G-NYQV1NNYW8",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export {
  auth,
  db,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
};
