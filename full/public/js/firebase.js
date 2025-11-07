"use strict";

// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, push, get } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// Your web app's Firebase configuration usando variables de entorno
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

/**
 * Guarda un voto en Firebase Realtime Database
 * @param {string} productId - ID del producto votado
 * @param {string} userName - Nombre del usuario que vota
 * @returns {Promise<{success: boolean, message: string}>}
 */
const saveVote = async (productId, userName) => {
  try {
    const votesRef = ref(database, 'votes');
    
    const voteData = {
      productId: productId,
      userName: userName,
      timestamp: Date.now(),
      date: new Date().toISOString()
    };

    await push(votesRef, voteData);

    return {
      success: true,
      message: '¡Voto registrado exitosamente! Gracias por participar.'
    };
  } catch (error) {
    console.error('Error al guardar voto:', error);
    return {
      success: false,
      message: 'Error al registrar el voto: ' + error.message
    };
  }
};

/**
 * Obtiene todos los votos desde Firebase
 * @returns {Promise<{success: boolean, data?: Object, message?: string}>}
 */
const getVotes = async () => {
  try {
    const votesRef = ref(database, 'votes');
    const snapshot = await get(votesRef);

    if (snapshot.exists()) {
      return {
        success: true,
        data: snapshot.val()
      };
    } else {
      return {
        success: true,
        data: {},
        message: 'No hay votos registrados aún'
      };
    }
  } catch (error) {
    console.error('Error al obtener votos:', error);
    return {
      success: false,
      message: 'Error al cargar los votos: ' + error.message
    };
  }
};

// Exportar funciones
export { saveVote, getVotes };