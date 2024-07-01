import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAmgy95YsVIkpHxuGpPAoUQrLWQC0gaDxI",
  authDomain: "voting-a5b91.firebaseapp.com",
  projectId: "voting-a5b91",
  storageBucket: "voting-a5b91.appspot.com",
  messagingSenderId: "355913119619",
  appId: "1:355913119619:web:48a16ab9f13a6d11f4a8b6",
  measurementId: "G-G4T9G704D4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };