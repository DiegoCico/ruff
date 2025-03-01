// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBULUSrPp6HSCNTEUdORVWffkD6Y2-WMls",
  authDomain: "ruff-5acc3.firebaseapp.com",
  projectId: "ruff-5acc3",
  storageBucket: "ruff-5acc3.firebasestorage.app",
  messagingSenderId: "914011009475",
  appId: "1:914011009475:web:63386d666127400251cd76",
  measurementId: "G-FD1Z5XMV19"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);