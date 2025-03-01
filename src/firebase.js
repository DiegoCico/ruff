// firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBULUSrPp6HSCNTEUdORVWffkD6Y2-WMls",
  authDomain: "ruff-5acc3.firebaseapp.com",
  projectId: "ruff-5acc3",
  storageBucket: "ruff-5acc3.appspot.com",
  messagingSenderId: "914011009475",
  appId: "1:914011009475:web:63386d666127400251cd76",
  measurementId: "G-FD1Z5XMV19"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { app, auth };
