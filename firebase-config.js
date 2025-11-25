import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyASJYMXybs7xeNBDOq_1sutz8JI6CkYsSk",
  authDomain: "pwa1-f942d.firebaseapp.com",
  projectId: "pwa1-f942d",
  storageBucket: "pwa1-f942d.firebasestorage.app",
  messagingSenderId: "1022123832934",
  appId: "1:1022123832934:web:7498bf3811618f25e2dfa7",
  measurementId: "G-XH6Z48ZB7J"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
