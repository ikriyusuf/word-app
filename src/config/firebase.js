import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA7_VpGbm8Mhuknga4KychjGb6ei1I28Bw",
  authDomain: "word-app-4d453.firebaseapp.com",
  projectId: "word-app-4d453",
  storageBucket: "word-app-4d453.firebasestorage.app",
  messagingSenderId: "492236730480",
  appId: "1:492236730480:web:b50a307a7d9d6afad044b5"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
