
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  getDatabase,
  ref,
  onValue
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";


// CONFIGURACIÓN DE FIREBASE
const firebaseConfig = {
   apiKey: "AIzaSyDyQvEH8gcS0vZtoJz3Mdma5eB1s5hteNU",
  authDomain: "detector-4375e.firebaseapp.com",
  databaseURL: "https://detector-4375e-default-rtdb.firebaseio.com",
  projectId: "detector-4375e",
  storageBucket: "detector-4375e.firebasestorage.app",
  messagingSenderId: "761927528589",
  appId: "1:761927528589:web:8e64df861118afeb1032c4"
};


// INICIALIZAR FIREBASE
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);


// ELEMENTOS HTML
const form = document.getElementById("login-form");
const estado = document.getElementById("estado");
const panel = document.getElementById("panel-registros");
const lista = document.getElementById("lista-registros");

const entradasEl = document.getElementById("total-entradas");
const salidasEl = document.getElementById("total-salidas");

const cerrarSesionBtn = document.getElementById("cerrar-sesion");

let detenerLectura = null;


// MOSTRAR MENSAJES
function mensaje(txt, error = false) {
  estado.textContent = txt;
  estado.classList.toggle("error", error);
}


// INICIAR SESIÓN
form.addEventListener("submit", async (e) => {

  e.preventDefault();

  mensaje("Conectando con Firebase...");

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  try {

    await signInWithEmailAndPassword(auth, email, password);

    console.log("Inicio de sesión correcto.");

  } catch (err) {

    console.error("Error de inicio de sesión:", err);

    mensaje("Error al iniciar sesión: " + err.message, true);

  }

});


// COMPROBAR AUTENTICACIÓN
onAuthStateChanged(auth, (user) => {

  // Detener lectura anterior
  if (detenerLectura) {

    detenerLectura();
    detenerLectura = null;

  }

  // Si no hay usuario conectado
  if (!user) {

    panel.hidden = true;
    form.hidden = false;

    mensaje("Ingresá con tu cuenta para ver los registros.");

    return;

  }


  // Usuario conectado
  form.hidden = true;
  panel.hidden = false;

  mensaje("Conectado. Consultando registros...");

  console.log("Usuario autenticado:", user.email);


  // LEER REGISTROS DE FIREBASE
  const movimientosRef = ref(db, "registro_movimiento");

  detenerLectura = onValue(

    movimientosRef,

    (snapshot) => {

      console.log("Firebase conectado correctamente.");
      console.log("Datos recibidos:", snapshot.val());

      lista.replaceChildren();

      let entradas = 0;
      let salidas = 0;

      const registros = [];


      // RECORRER LOS REGISTROS
      snapshot.forEach((child) => {

        registros.push({
          id: child.key,
          valor: child.val()
        });

      });


      // MOSTRAR PRIMERO LOS MÁS RECIENTES
      registros.reverse();


      registros.forEach((registro) => {

        const texto = String(registro.valor ?? "");

        const corte = texto.lastIndexOf(" - ");

        let fecha;
        let tipo;


        // IDENTIFICAR FECHA Y MOVIMIENTO
        if (corte >= 0) {

          fecha = texto.slice(0, corte);
          tipo = texto.slice(corte + 3).trim().toUpperCase();

        } else {

          fecha = texto;
          tipo = "SIN CLASIFICAR";

        }


        // CONTAR ENTRADAS Y SALIDAS
        if (tipo === "ENTRADA") {

          entradas++;

        }

        if (tipo === "SALIDA") {

          salidas++;

        }


        // CREAR FILA DE LA TABLA
        const fila = document.createElement("tr");

        const celdaFecha = document.createElement("td");
        const celdaTipo = document.createElement("td");

        celdaFecha.textContent = fecha;
        celdaTipo.textContent = tipo;


        // COLORES SEGÚN EL MOVIMIENTO
        if (tipo === "ENTRADA") {

          celdaTipo.className = "tipo-entrada";

        } else if (tipo === "SALIDA") {

          celdaTipo.className = "tipo-salida";

        } else {

          celdaTipo.className = "tipo-sin-clasificar";

        }


        fila.appendChild(celdaFecha);
        fila.appendChild(celdaTipo);

        lista.appendChild(fila);

      });


      // ACTUALIZAR CONTADORES
      entradasEl.textContent = entradas;
      salidasEl.textContent = salidas;


      // SI NO HAY REGISTROS
      if (registros.length === 0) {

        const fila = document.createElement("tr");
        const celda = document.createElement("td");

        celda.colSpan = 2;

        celda.textContent = "Todavía no hay movimientos registrados.";

        fila.appendChild(celda);
        lista.appendChild(fila);

      }


      // MENSAJE FINAL
      mensaje(
        "Se cargaron " + registros.length + " registros correctamente."
      );

      console.log("Total de registros:", registros.length);
      console.log("Entradas:", entradas);
      console.log("Salidas:", salidas);

    },


    // ERROR AL LEER FIREBASE
    (error) => {

      console.error("ERROR FIREBASE:", error);

      mensaje(
        "Error al leer Firebase: " + error.message,
        true
      );

    }

  );

});


// CERRAR SESIÓN
cerrarSesionBtn.addEventListener("click", async () => {

  try {

    await signOut(auth);

    console.log("Sesión cerrada.");

  } catch (error) {

    console.error("Error al cerrar sesión:", error);

    mensaje("No se pudo cerrar la sesión.", true);

  }

});

