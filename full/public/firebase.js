// js/firebase.js
// Inicializa Firebase y exporta funciones para Realtime Database

"use strict";

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";
import { getDatabase, ref, push, set, get } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-database.js";

/* ========== CONFIG FIJA (de tu proyecto) ========== */
const firebaseConfig = {
  apiKey: "AIzaSyAHF_LIgjJw6b9QgMdnDjFnn44csQbYKAU",
  authDomain: "deforestacion-c55a1.firebaseapp.com",
  databaseURL: "https://deforestacion-c55a1-default-rtdb.firebaseio.com/",
  projectId: "deforestacion-c55a1",
  storageBucket: "deforestacion-c55a1.firebasestorage.app",
  messagingSenderId: "970492803559",
  appId: "1:970492803559:web:1eecbc528c59f435e76542",
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

/* ---------------------------
   REGISTRATIONS (voluntarios)
   --------------------------- */
export const saveRegistration = async (data) => {
  try {
    const nodeRef = ref(database, "registrations");
    const newRef = push(nodeRef);
    await set(newRef, data);
    return { success: true, id: newRef.key };
  } catch (err) {
    console.error("saveRegistration error:", err);
    return { success: false, message: err.message || String(err) };
  }
};

export const getRegistrations = async () => {
  try {
    const snapshot = await get(ref(database, "registrations"));
    if (snapshot.exists()) return { success: true, data: snapshot.val() };
    return { success: true, data: {} };
  } catch (err) {
    console.error("getRegistrations error:", err);
    return { success: false, message: err.message || String(err) };
  }
};

/* ---------------------------
   PRODUCTS (mercancía)
   --------------------------- */
export const getProducts = async () => {
  try {
    const snapshot = await get(ref(database, "products"));
    if (snapshot.exists()) return { success: true, data: snapshot.val() };
    return { success: true, data: {} };
  } catch (err) {
    console.error("getProducts error:", err);
    return { success: false, message: err.message || String(err) };
  }
};

/* ---------------------------
   SUBSCRIBERS (newsletter)
   --------------------------- */
export const saveSubscriber = async (email) => {
  try {
    const nodeRef = ref(database, "subscribers");
    const newRef = push(nodeRef);
    await set(newRef, { email, fecha: new Date().toISOString() });
    return { success: true, id: newRef.key };
  } catch (err) {
    console.error("saveSubscriber error:", err);
    return { success: false, message: err.message || String(err) };
  }
};

/* ---------------------------
   VOTES
   --------------------------- */
export const saveVote = async (productId, userName = "") => {
  try {
    if (!productId) throw new Error("productId requerido");
    const nodeRef = ref(database, "votes");
    const newRef = push(nodeRef);
    await set(newRef, {
      productId,
      userName: userName || "Anónimo",
      timestamp: new Date().toISOString(),
    });
    return { success: true, id: newRef.key, message: "Voto registrado" };
  } catch (err) {
    console.error("saveVote error:", err);
    return { success: false, message: err.message || String(err) };
  }
};

export const getVotes = async () => {
  try {
    const snapshot = await get(ref(database, "votes"));
    if (snapshot.exists()) return { success: true, data: snapshot.val() };
    return { success: true, data: {} };
  } catch (err) {
    console.error("getVotes error:", err);
    return { success: false, message: err.message || String(err) };
  }
};

/* Exportar app y database (por si las necesitas en otros módulos) */
export { app, database };
