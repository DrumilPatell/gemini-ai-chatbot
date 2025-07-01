import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAvqaZqzZe5awQMH-pMMLhqqFE7vN-XoXY",
  authDomain: "gemini-ai-chatbot-af1e7.firebaseapp.com",
  projectId: "gemini-ai-chatbot-af1e7",
  storageBucket: "gemini-ai-chatbot-af1e7.firebasestorage.app",
  messagingSenderId: "788360988391",
  appId: "1:788360988391:web:5f552839d9a8982a06c442"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
