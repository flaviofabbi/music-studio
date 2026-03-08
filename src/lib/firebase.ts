// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAxHoklEuqI6OLu0N9jEQlyrswlUEsaeh8",
  authDomain: "hipica-22409.firebaseapp.com",
  projectId: "hipica-22409",
  storageBucket: "hipica-22409.firebasestorage.app",
  messagingSenderId: "923397247308",
  appId: "1:923397247308:web:2421137655bc6f53a2ffe9",
  measurementId: "G-RX9ZEQZTL3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
