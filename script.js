import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { doc, getDoc, setDoc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
import { collection, query, where, orderBy, getDocs } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

// Inicializar datos si no existen
function inicializarDatos() {
    if (!localStorage.getItem('historialGastos')) {
        localStorage.setItem('historialGastos', JSON.stringify([]));
    }
    if (!localStorage.getItem('sueldoMensual')) {
        localStorage.setItem('sueldoMensual', '0');
    }
    if (!localStorage.getItem('sueldoDisponible')) {
        localStorage.setItem('sueldoDisponible', '0');
    }
}

// Función para actualizar los montos en la página
function actualizarMontos(sueldoMensual, sueldoDisponible) {
    const sueldoMensualElement = document.getElementById('sueldo-mensual');
    const sueldoDisponibleElement = document.getElementById('sueldo-disponible');
    
    if (sueldoMensualElement) {
        sueldoMensualElement.textContent = `RD$ ${sueldoMensual.toFixed(2)}`;
    }
    if (sueldoDisponibleElement) {
        sueldoDisponibleElement.textContent = `RD$ ${sueldoDisponible.toFixed(2)}`;
    }
}

// Función para guardar datos en Firestore
async function guardarDatosUsuario(uid, datos) {
    try {
        const userRef = doc(db, "usuarios", uid);
        await setDoc(userRef, datos, { merge: true });
        console.log("Datos guardados correctamente en Firestore");
    } catch (error) {
        console.error("Error al guardar datos en Firestore:", error);
        throw error;
    }
}

// Función para cargar datos desde Firestore
async function cargarDatosUsuario(uid) {
    try {
        const userRef = doc(db, "usuarios", uid);
        const docSnap = await getDoc(userRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            const sueldoMensual = parseFloat(data.sueldoMensual || '0');
            const sueldoDisponible = parseFloat(data.sueldoDisponible || '0');
            
            // Actualizar localStorage
            localStorage.setItem('sueldoMensual', sueldoMensual.toString());
            localStorage.setItem('sueldoDisponible', sueldoDisponible.toString());
            
            if (data.historialGastos) {
                localStorage.setItem('historialGastos', JSON.stringify(data.historialGastos));
            }
            
            // Actualizar UI
            actualizarMontos(sueldoMensual, sueldoDisponible);
            
            return data;
        } else {
            console.log("No se encontraron datos para este usuario");
            return null;
        }
    } catch (error) {
        console.error("Error al cargar datos de Firestore:", error);
        throw error;
    }
}

// Función para manejar el formulario de gastos
function manejarFormularioGastos() {
    const form = document.getElementById('gastoForm');
    if (!form) return;

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const monto = parseFloat(document.getElementById('monto').value);
        const descripcion = document.getElementById('descripcion').value;
        
        // Obtener sueldo disponible actual
        let sueldoDisponible = parseFloat(localStorage.getItem('sueldoDisponible'));
        
        // Verificar si hay suficiente saldo
        if (monto > sueldoDisponible) {
            alert('No tiene suficiente saldo disponible para este gasto');
            return;
        }
        
        // Actualizar sueldo disponible
        sueldoDisponible -= monto;
        
        // Crear nuevo gasto
        const nuevoGasto = {
            monto,
            descripcion,
            fecha: new Date().toISOString()
        };
        
        // Obtener historial actual
        const historialGastos = JSON.parse(localStorage.getItem('historialGastos') || '[]');
        historialGastos.push(nuevoGasto);
        
        // Guardar en Firestore
        const user = auth.currentUser;
        if (user) {
            await guardarDatosUsuario(user.uid, {
                sueldoDisponible,
                historialGastos
            });
        }
        
        // Actualizar localStorage
        localStorage.setItem('sueldoDisponible', sueldoDisponible.toString());
        localStorage.setItem('historialGastos', JSON.stringify(historialGastos));
        
        // Mostrar mensaje de éxito
        const mensaje = document.getElementById('mensaje');
        if (mensaje) {
            mensaje.innerHTML = `
                <div class="mensaje-exito">
                    Gasto registrado correctamente. Sueldo disponible: RD$ ${sueldoDisponible.toFixed(2)}
                </div>
            `;
        }
        
        // Limpiar formulario
        form.reset();
        
        // Actualizar montos en la UI
        actualizarMontos(parseFloat(localStorage.getItem('sueldoMensual') || '0'), sueldoDisponible);
    });
}

// Función para inicializar la configuración
function inicializarConfiguracion() {
    // Selector de tema
    const selectTema = document.getElementById('select-tema');
    if (selectTema) {
        // Cargar tema guardado
        const modoOscuro = localStorage.getItem('modoOscuro') || 'claro';
        selectTema.value = modoOscuro;
        if (modoOscuro === 'oscuro') {
            document.body.classList.add('dark-mode');
        }

        // Evento de cambio de tema
        selectTema.addEventListener('change', function() {
            const modo = this.value;
            localStorage.setItem('modoOscuro', modo);
            if (modo === 'oscuro') {
                document.body.classList.add('dark-mode');
            } else {
                document.body.classList.remove('dark-mode');
            }
        });
    }

    // Selector de moneda
    const selectMoneda = document.getElementById('select-moneda');
    if (selectMoneda) {
        // Cargar moneda guardada
        const monedaPreferida = localStorage.getItem('monedaPreferida') || 'RD$';
        selectMoneda.value = monedaPreferida;

        // Evento de cambio de moneda
        selectMoneda.addEventListener('change', function() {
            localStorage.setItem('monedaPreferida', this.value);
        });
    }

    // Fecha de inicio del mes
    const fechaInicioMes = document.getElementById('fecha-inicio-mes');
    if (fechaInicioMes) {
        // Cargar fecha guardada
        const fechaGuardada = localStorage.getItem('fechaInicioMes') || '1';
        fechaInicioMes.value = fechaGuardada;

        // Evento de cambio de fecha
        fechaInicioMes.addEventListener('change', function() {
            const valor = Math.min(31, Math.max(1, parseInt(this.value) || 1));
            this.value = valor;
            localStorage.setItem('fechaInicioMes', valor.toString());
        });
    }

    // Nombre de usuario
    const nombreUsuario = document.getElementById('nombre-usuario');
    if (nombreUsuario) {
        // Cargar nombre guardado
        const nombreGuardado = localStorage.getItem('nombreUsuario') || '';
        nombreUsuario.value = nombreGuardado;

        // Evento de cambio de nombre
        nombreUsuario.addEventListener('change', function() {
            localStorage.setItem('nombreUsuario', this.value);
        });
    }

    // Botón de reset
    const resetearDatos = document.getElementById('resetear-datos');
    if (resetearDatos) {
        resetearDatos.addEventListener('click', function() {
            if (confirm('¿Estás seguro de que quieres resetear todos los datos? Esta acción no se puede deshacer.')) {
                localStorage.clear();
                window.location.href = 'index.html';
            }
        });
    }
}

function actualizarResumenDelMes() {
    const ingresos = JSON.parse(localStorage.getItem('historialIngresos') || '[]');
    const gastos = JSON.parse(localStorage.getItem('historialGastos') || '[]');
    const deudas = JSON.parse(localStorage.getItem('deudasActivas') || '[]');

    const totalIngresos = ingresos.reduce((acc, item) => acc + parseFloat(item.monto), 0);
    const totalGastos = gastos.reduce((acc, item) => acc + parseFloat(item.monto), 0);
    const totalDeudas = deudas.reduce((acc, item) => acc + parseFloat(item.monto), 0);

    const ingresosSpan = document.getElementById('resumen-ingresos');
    const gastosSpan = document.getElementById('resumen-gastos');
    const deudasSpan = document.getElementById('resumen-deudas');

    if (ingresosSpan) ingresosSpan.textContent = `RD$ ${totalIngresos.toFixed(2)}`;
    if (gastosSpan) gastosSpan.textContent = `RD$ ${totalGastos.toFixed(2)}`;
    if (deudasSpan) deudasSpan.textContent = `RD$ ${totalDeudas.toFixed(2)}`;
}

// Manejo de autenticación y carga de datos
document.addEventListener("DOMContentLoaded", () => {
    // Inicializar datos
    inicializarDatos();
    
    // Cargar montos iniciales
    const sueldoMensual = parseFloat(localStorage.getItem('sueldoMensual') || '0');
    const sueldoDisponible = parseFloat(localStorage.getItem('sueldoDisponible') || '0');
    actualizarMontos(sueldoMensual, sueldoDisponible);

    // Inicializar configuración
    inicializarConfiguracion();

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            console.log("Usuario autenticado:", user.email);
            const userInfoElement = document.getElementById("user-info");
            if (userInfoElement) {
                userInfoElement.innerHTML = `<strong>👋 Hola</strong><br><small>${user.email}</small>`;
            }
            
            try {
                // Cargar datos del usuario
                await cargarDatosUsuario(user.uid);
            } catch (error) {
                console.error("Error al cargar datos del usuario:", error);
            }
        } else {
            console.log("No hay usuario autenticado");
            window.location.href = "login.html";
        }
    });

    // Manejo de cierre de sesión
    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            signOut(auth).then(() => {
                window.location.href = "login.html";
            }).catch((error) => {
                console.error("Error al cerrar sesión:", error);
            });
        });
    }

    const toggleButton = document.getElementById('toggle-dark-mode');
    if (toggleButton) {
        toggleButton.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
        });
    }

    // Manejo del reinicio del mes
    const reiniciarMesBtn = document.getElementById('reiniciarMes');
    const ultimoReinicioInfo = document.getElementById('ultimoReinicio');

    // Mostrar última fecha de reinicio si existe
    const ultimaFechaReinicio = localStorage.getItem('ultimaFechaReinicio');
    if (ultimoReinicioInfo && ultimaFechaReinicio) {
        const fecha = new Date(ultimaFechaReinicio);
        ultimoReinicioInfo.textContent = `Último reinicio: ${fecha.toLocaleDateString('es-ES')}`;
    }

    // Función para reiniciar el mes
    if (reiniciarMesBtn) {
        reiniciarMesBtn.addEventListener('click', async function () {
            // Obtener datos actuales
            const historialGastos = JSON.parse(localStorage.getItem('historialGastos') || '[]');
            const historialIngresos = JSON.parse(localStorage.getItem('historialIngresos') || '[]');
            const sueldoMensual = parseFloat(localStorage.getItem('sueldoMensual') || '0');

            // Validar que haya datos para reiniciar
            if (historialGastos.length === 0 && historialIngresos.length === 0) {
                alert('No hay datos para reiniciar.');
                return;
            }

            // Crear registro mensual
            const historialMensual = JSON.parse(localStorage.getItem('historialMensual') || '[]');
            const mesActual = new Date().toISOString().slice(0, 7); // Formato YYYY-MM

            historialMensual.push({
                mes: mesActual,
                gastos: historialGastos,
                ingresos: historialIngresos,
                fechaReinicio: new Date().toISOString()
            });

            // Guardar en Firestore
            const user = auth.currentUser;
            if (user) {
                try {
                    await guardarDatosUsuario(user.uid, {
                        historialMensual,
                        sueldoDisponible: sueldoMensual
                    });
                } catch (error) {
                    console.error("Error al guardar datos en Firestore:", error);
                    alert("Error al guardar los datos. Por favor, intente nuevamente.");
                    return;
                }
            }

            // Guardar historial mensual en localStorage
            localStorage.setItem('historialMensual', JSON.stringify(historialMensual));

            // Limpiar datos actuales
            localStorage.setItem('historialGastos', JSON.stringify([]));
            localStorage.setItem('historialIngresos', JSON.stringify([]));
            localStorage.setItem('sueldoDisponible', sueldoMensual.toString());

            // Guardar fecha del reinicio
            localStorage.setItem('ultimaFechaReinicio', new Date().toISOString());

            // Actualizar visualización
            const sueldoDisponibleElement = document.getElementById('sueldo-disponible');
            if (sueldoDisponibleElement) {
                sueldoDisponibleElement.textContent = `RD$ ${sueldoMensual.toFixed(2)}`;
            }

            if (ultimoReinicioInfo) {
                ultimoReinicioInfo.textContent = `Último reinicio: ${new Date().toLocaleDateString('es-ES')}`;
            }

            // Mostrar mensaje de éxito
            alert('Mes reiniciado correctamente. Todo comienza desde cero.');
        });
    }

    actualizarResumenDelMes();
    manejarFormularioGastos();

    // Eliminar el evento del formulario de metas
    // const formMeta = document.getElementById('form-meta');
    // if (formMeta) {
    //     formMeta.addEventListener('submit', (e) => {
    //         e.preventDefault();
    //         guardarMeta();
    //     });
    // }

    // Eliminar la carga de metas al iniciar sesión
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // cargarMetas(); // Eliminar esta línea
        }
    });
});
