import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCsCClf6eJknr2cIiBWSgAqQ_q8LVoyG_k",
  authDomain: "bjerkreim-lyd-lys.firebaseapp.com",
  projectId: "bjerkreim-lyd-lys",
  storageBucket: "bjerkreim-lyd-lys.firebasestorage.app",
  messagingSenderId: "448986782503",
  appId: "1:448986782503:web:70b356c6adba737d342702"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);