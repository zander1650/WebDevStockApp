// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";     
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCBSX5Hi8gGetDLnY2JyRdVZeQEvzTqehc",
  authDomain: "stockcentral-27c0a.firebaseapp.com",
  projectId: "stockcentral-27c0a",
  storageBucket: "stockcentral-27c0a.firebasestorage.app",
  messagingSenderId: "951257118868",
  appId: "1:951257118868:web:ecf2cbe191932f6c7c5c81"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);  
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);