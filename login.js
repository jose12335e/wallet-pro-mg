import { app } from './firebase-config.js';
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword 
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";

const auth = getAuth(app);

document.addEventListener('DOMContentLoaded', function() {
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const mensaje = document.getElementById('mensaje');

    // Función para mostrar mensajes
    function mostrarMensaje(texto, esError = false) {
        mensaje.textContent = texto;
        mensaje.style.color = esError ? 'red' : 'green';
    }

    // Función para redirigir al index
    function redirigirAIndex() {
        window.location.href = 'index.html';
    }

    // Registro de nuevo usuario
    registerBtn.addEventListener('click', async function() {
        const email = emailInput.value;
        const password = passwordInput.value;

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            // Guardar UID en localStorage
            localStorage.setItem('usuarioId', user.uid);
            
            mostrarMensaje('Cuenta creada exitosamente');
            setTimeout(redirigirAIndex, 1500);
        } catch (error) {
            console.error("Firebase Error:", error.code, error.message);
            mensaje.style.color = "red";
            mensaje.textContent = "Error: " + error.message;
        }
    });

    // Inicio de sesión
    loginBtn.addEventListener('click', async function() {
        const email = emailInput.value;
        const password = passwordInput.value;

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            // Guardar UID en localStorage
            localStorage.setItem('usuarioId', user.uid);
            
            mostrarMensaje('Inicio de sesión exitoso');
            setTimeout(redirigirAIndex, 1500);
        } catch (error) {
            console.error("Firebase Error:", error.code, error.message);
            mensaje.style.color = "red";
            mensaje.textContent = "Error: " + error.message;
        }
    });
}); 