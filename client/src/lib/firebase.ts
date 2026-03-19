import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAA6WdXc04dxCI1bxwEhKc5-Lv7gYM_Fac",
  authDomain: "surveymetrix-a4fc9.firebaseapp.com",
  projectId: "surveymetrix-a4fc9",
  storageBucket: "surveymetrix-a4fc9.firebasestorage.app",
  messagingSenderId: "759452252467",
  appId: "1:759452252467:web:03e77fc3a3fffb1c162646",
  measurementId: "G-JJQHWR0KQQ",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const WAITLIST_COLLECTION = "waitlist";
