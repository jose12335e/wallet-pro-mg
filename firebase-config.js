import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBS5MC4ToatIJ_wGrp4t9A4FIgvJp21V50",
  authDomain: "control-de-gastos-c48fe.firebaseapp.com",
  projectId: "control-de-gastos-c48fe",
  storageBucket: "control-de-gastos-c48fe.appspot.com",
  messagingSenderId: "355153728573",
  appId: "1:355153728573:web:f4b524d13deaa0e06e8654"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db }; 