// Firebase imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    serverTimestamp, 
    onSnapshot 
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

// ⚠️ CAMBIA ESTO POR TU CONFIG REAL DE FIREBASE
const firebaseConfig = {
   apiKey: "AIzaSyASJYMXybs7xeNBDOq_1sutz8JI6CkYsSk",
  authDomain: "pwa1-f942d.firebaseapp.com",
  projectId: "pwa1-f942d",
  storageBucket: "pwa1-f942d.firebasestorage.app",
  messagingSenderId: "1022123832934",
  appId: "1:1022123832934:web:7498bf3811618f25e2dfa7",
  measurementId: "G-XH6Z48ZB7J"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ===========================================
// GUARDAR MENSAJE EN FIREBASE
// ===========================================
window.guardarMensaje = async function () {
    let nombre = document.getElementById("nombre").value.trim();
    let mensaje = document.getElementById("mensaje").value.trim();

    if (!nombre || !mensaje) {
        alert("Escribe tu nombre y mensaje.");
        return;
    }

    await addDoc(collection(db, "mensajes"), {
        nombre: nombre,
        mensaje: mensaje,
        fecha: serverTimestamp()
    });

    document.getElementById("nombre").value = "";
    document.getElementById("mensaje").value = "";
};

// ===========================================
// LEER MENSAJES EN TIEMPO REAL
// ===========================================
const lista = document.getElementById("lista-mensajes");

onSnapshot(collection(db, "mensajes"), (snapshot) => {
    lista.innerHTML = ""; 

    snapshot.forEach((doc) => {
        const data = doc.data();

        const p = document.createElement("p");
        p.textContent = `${data.nombre}: ${data.mensaje}`;

        lista.appendChild(p);
    });

    if (snapshot.empty) {
        lista.innerHTML = "<p>No hay mensajes guardados.</p>";
    }
});
