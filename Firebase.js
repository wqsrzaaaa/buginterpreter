import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyB2Mny1JQdmf8qDa_IJkrrzVnTQ-y9rBlA",
  authDomain: "gemini3-api-567a0.firebaseapp.com",
  projectId: "gemini3-api-567a0",
  storageBucket: "gemini3-api-567a0.appspot.com",
  messagingSenderId: "58381136834",
  appId: "1:58381136834:web:f28fe726564226b49e1c5b"
};


const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
