// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
const analytics = getAnalytics(app);
