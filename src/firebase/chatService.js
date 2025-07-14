import { db } from "./firebase";
import {
  collection,
  addDoc,
  getDocs,
  orderBy,
  query,
  deleteDoc
} from "firebase/firestore";

const COLLECTION_NAME = "chatHistory";

export async function saveMessage(message) {
  try {
    await addDoc(collection(db, COLLECTION_NAME), {
      ...message,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error("Error saving message:", error);
  }
}

export async function loadChatHistory() {
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy("createdAt", "asc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => doc.data());
  } catch (error) {
    console.error("Error loading chat history:", error);
    return [];
  }
}

export async function deleteAllMessages() {
  try {
    const snapshot = await getDocs(collection(db, COLLECTION_NAME));
    const batch = snapshot.docs.map((doc) => deleteDoc(doc.ref));
    await Promise.all(batch);
  } catch (error) {
    console.error("Error deleting chat history:", error);
  }
}