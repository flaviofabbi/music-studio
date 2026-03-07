import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey : "AIzaSyAOYjPfLJ9lPJvn5w_GYb2RjjOJuX618ik" , 
  authDomain:"projetox-cb033.firebaseapp.com", 
  ID do projeto : "projetox-cb033 " 
  bucket de armazenamento : "projetox-cb033.firebasestorage.app " 
  messagingSenderId : " 143881620903" 
  appId : "1:143881620903:web:dd5b2dde03caf93fa87a82" , 
  ID da medição : "G-2QQRTM13CT" 
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
