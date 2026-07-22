import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getFirestore, collection, doc, setDoc, getDoc, getDocs, 
    updateDoc, deleteDoc, query, where, orderBy, addDoc, onSnapshot 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { 
    getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, 
    signOut, onAuthStateChanged, updateProfile,
    GoogleAuthProvider, signInWithPopup
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyC8cVE-i7GVQeIaUEy_kN-YHjBXMHmyJbw",
  authDomain: "ozon-mc.firebaseapp.com",
  projectId: "ozon-mc",
  storageBucket: "ozon-mc.firebasestorage.app",
  messagingSenderId: "1074749334331",
  appId: "1:1074749334331:web:89d09672589bf54dfc4d1e",
  measurementId: "G-YRZCS6BRRQ"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { 
    db, auth, googleProvider,
    collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, 
    query, where, orderBy, addDoc, onSnapshot,
    createUserWithEmailAndPassword, signInWithEmailAndPassword, 
    signOut, onAuthStateChanged, updateProfile,
    signInWithPopup
};
