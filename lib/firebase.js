import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = { 
  apiKey: "AIzaSyC_SiMq402MB9gJMMlqq-42C0uklnn7G10", 
  authDomain: "studenthub-102e5.firebaseapp.com", 
  projectId: "studenthub-102e5", 
  storageBucket: "studenthub-102e5.firebasestorage.app", 
  messagingSenderId: "1084030958013", appId: "1:1084030958013:web:230096f2add788254a3ad4", }; 
 
 
  const app = initializeApp(firebaseConfig); 
  export const auth = getAuth(app); 
  export const db = getFirestore(app);
