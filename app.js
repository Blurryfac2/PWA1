// Firebase imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    onSnapshot,
    query,
    orderBy,
    deleteDoc,
    doc,
    getDocs,
    where
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

// ⚠️ Cambia esto por tu config real
const firebaseConfig = {
    apiKey: "AIzaSyASJYMXybs7xeNBDOq_1sutz8JI6CkYsSk",
    authDomain: "pwa1-f942d.firebaseapp.com",
    projectId: "pwa1-f942d",
    storageBucket: "pwa1-f942d.appspot.com",
    messagingSenderId: "1022123832934",
    appId: "1:1022123832934:web:7498bf3811618f25e2dfa7"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ===========================================
// CONFIG: Si NO quieres autenticación, pon USE_AUTH = false
// ===========================================
const USE_AUTH = false; // autenticación removida por pedido del usuario

// ===========================================
// GUARDAR MENSAJE (con manejo de errores y log)
// Guarda en Firestore si es posible; si falla por permisos, guarda en localStorage
// ===========================================
window.guardarMensaje = async function () {
    let nombre = document.getElementById("nombre").value.trim();
    let mensaje = document.getElementById("mensaje").value.trim();

    if (!nombre || !mensaje) {
        alert("Escribe tu nombre y mensaje.");
        return;
    }

    // Intentar guardar en Firestore si se permite
    if (USE_AUTH) {
        try {
            const docRef = await addDoc(collection(db, "mensajes"), {
                nombre: nombre,
                mensaje: mensaje,
                fecha: Date.now()
            });
            console.log('Mensaje guardado, id:', docRef.id);
            appendMessageToUI({ nombre, mensaje });
            document.getElementById("nombre").value = "";
            document.getElementById("mensaje").value = "";
            return;
        } catch (err) {
            console.error('Error guardando mensaje en Firestore:', err);
            // Si el error es de permisos, caemos a modo local
            if (err && err.code && err.code === 'permission-denied') {
                enableLocalMode(`Firestore: ${err.code} - ${err.message}`);
            } else {
                alert('Error guardando el mensaje en Firestore. Se guardará localmente.');
            }
        }
    }

    // Guardar en localStorage como fallback
    const obj = { nombre, mensaje, fecha: Date.now() };
    saveLocalMessage(obj);
    appendMessageToUI(obj);
    // Mostrar notificación automática de nuevo mensaje guardado
    try { sendNotification('Nuevo mensaje guardado', `${nombre}: ${mensaje}`); } catch (e) { console.warn('No se pudo enviar notificación al guardar:', e); }
    document.getElementById("nombre").value = "";
    document.getElementById("mensaje").value = "";
};

// Append an individual message to UI
function appendMessageToUI(data) {
    if (!lista) return;
    // Compute a stable id for this message (Firestore _id or local id)
    const uniqueId = data._id || data.id || (data.fecha ? `${data.fecha}|${data.nombre}|${data.mensaje}` : `${data.nombre}|${data.mensaje}`);
    // Avoid rendering duplicates
    if (lista.querySelector(`[data-msg-id="${uniqueId}"]`)) return;

    // Outer container (paragraph) - we'll tag it with data-msg-id
    const container = document.createElement('p');
    container.setAttribute('data-msg-id', uniqueId);

    // Create message wrapper to include optional delete button
    const wrapper = document.createElement('div');
    wrapper.style.display = 'flex';
    wrapper.style.justifyContent = 'space-between';
    wrapper.style.alignItems = 'center';

    const text = document.createElement('span');
    text.textContent = `${data.nombre}: ${data.mensaje}`;
    wrapper.appendChild(text);

    if (data.id) {
        const del = document.createElement('button');
        del.textContent = 'Eliminar';
        del.style.marginLeft = '10px';
        del.style.background = '#e74c3c';
        del.style.color = 'white';
        del.style.border = 'none';
        del.style.borderRadius = '6px';
        del.style.padding = '6px 8px';
        del.addEventListener('click', () => {
            removeLocalMessageById(data.id);
            // remove the whole container
            container.remove();
        });
        wrapper.appendChild(del);
    }

    if (data._id) {
        const delF = document.createElement('button');
        delF.textContent = 'Eliminar (Firebase)';
        delF.style.marginLeft = '10px';
        delF.style.background = '#c0392b';
        delF.style.color = 'white';
        delF.style.border = 'none';
        delF.style.borderRadius = '6px';
        delF.style.padding = '6px 8px';
        delF.addEventListener('click', async () => {
            if (!confirm('¿Eliminar este mensaje de Firebase?')) return;
            try {
                await deleteDoc(doc(db, 'mensajes', data._id));
                container.remove();
            } catch (err) {
                console.error('Error eliminando mensaje Firebase:', err);
                alert('No se pudo eliminar en Firebase: ' + (err.message || err.code || err));
            }
        });
        wrapper.appendChild(delF);
    }

    container.appendChild(wrapper);
    // Insert at top
    lista.insertBefore(container, lista.firstChild);
}

// LocalStorage helpers
const LOCAL_KEY = 'local_mensajes_v1';
function saveLocalMessage(obj) {
    try {
        const arr = JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]');
        // ensure each local message has an id for delete/sync operations
        if (!obj.id) obj.id = Date.now().toString(36) + Math.random().toString(36).slice(2,8);
        // track sync status
        if (typeof obj.synced === 'undefined') obj.synced = false;
        if (obj.remoteId === undefined) obj.remoteId = null;
        arr.unshift(obj);
        localStorage.setItem(LOCAL_KEY, JSON.stringify(arr));
    } catch (e) {
        console.error('Error guardando localmente:', e);
    }
}

function loadLocalMessagesToUI() {
    try {
        const arr = JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]');
        if (!lista) return;
        // This function clears the UI and renders only local messages
        lista.innerHTML = '';
        if (!arr.length) {
            lista.innerHTML = '<p>No hay mensajes guardados.</p>';
            return;
        }
        arr.forEach(item => appendMessageToUI(item));
    } catch (e) {
        console.error('Error al cargar mensajes locales:', e);
    }
}

// Append local messages to the existing UI without clearing it.
function appendLocalMessagesToUI() {
    try {
        const arr = JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]');
        if (!lista) return;
        if (!arr.length) return;
        arr.forEach(item => appendMessageToUI(item));
    } catch (e) {
        console.error('Error al añadir mensajes locales al UI:', e);
    }
}

async function removeLocalMessageById(id) {
    try {
        const arr = JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]');
        const idx = arr.findIndex(it => it.id === id);
        if (idx === -1) return;
        const item = arr[idx];
        // First try to delete corresponding documents in Firestore (match by fields)
        if (item && item.nombre && item.mensaje) {
            try {
                const q = query(collection(db, 'mensajes'), where('nombre', '==', item.nombre), where('mensaje', '==', item.mensaje), where('fecha', '==', item.fecha));
                const snap = await getDocs(q);
                snap.forEach(async (d) => {
                    try {
                        await deleteDoc(doc(db, 'mensajes', d.id));
                        console.log('Documento Firebase eliminado:', d.id);
                    } catch (err) {
                        console.warn('No se pudo eliminar doc Firebase:', err);
                    }
                });
            } catch (err) {
                console.warn('Error buscando doc en Firestore para borrar:', err);
            }
        }
        // Remove locally
        arr.splice(idx, 1);
        localStorage.setItem(LOCAL_KEY, JSON.stringify(arr));
    } catch (e) {
        console.error('Error eliminando mensaje local:', e);
    }
}

// Remove local message element from UI by its local id
function removeLocalMessageFromUIById(localId) {
    if (!lista) return;
    const el = lista.querySelector(`[data-msg-id="${localId}"]`);
    if (el) el.remove();
}

// After a successful upload, mark the local UI entry as synced and attach a Firebase-delete button
function updateLocalUIAfterSync(localId, remoteId) {
    if (!lista) return;
    const container = lista.querySelector(`[data-msg-id="${localId}"]`);
    if (!container) return;

    // add/ensure a synced badge
    let badge = container.querySelector('.badge-synced');
    if (!badge) {
        badge = document.createElement('span');
        badge.className = 'badge-synced';
        badge.textContent = 'Sincronizado';
        badge.style.background = '#2ecc71';
        badge.style.color = 'white';
        badge.style.padding = '2px 6px';
        badge.style.marginLeft = '8px';
        badge.style.borderRadius = '6px';
        // append near the text (first span)
        const span = container.querySelector('span');
        if (span) span.parentNode.insertBefore(badge, span.nextSibling);
    }

    // add a Firebase-delete button for this synced local item
    // But avoid adding duplicate button
    if (!container.querySelector('[data-fb-del]')) {
        const btn = document.createElement('button');
        btn.textContent = 'Eliminar (Firebase)';
        btn.setAttribute('data-fb-del', remoteId);
        btn.style.marginLeft = '10px';
        btn.style.background = '#c0392b';
        btn.style.color = 'white';
        btn.style.border = 'none';
        btn.style.borderRadius = '6px';
        btn.style.padding = '6px 8px';
        btn.addEventListener('click', async () => {
            if (!confirm('¿Eliminar este mensaje de Firebase?')) return;
            try {
                await deleteDoc(doc(db, 'mensajes', remoteId));
                // mark local as unsynced (remove remoteId and synced flag)
                try {
                    const arr = JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]');
                    const idx = arr.findIndex(it => it.id === localId);
                    if (idx !== -1) {
                        arr[idx].synced = false;
                        arr[idx].remoteId = null;
                        localStorage.setItem(LOCAL_KEY, JSON.stringify(arr));
                    }
                } catch (e) { console.warn('No se pudo actualizar localStorage tras borrar remoto:', e); }
                // remove badge and this button
                const b = container.querySelector('.badge-synced'); if (b) b.remove();
                btn.remove();
            } catch (err) {
                console.error('Error eliminando mensaje Firebase:', err);
                alert('No se pudo eliminar en Firebase: ' + (err.message || err.code || err));
            }
        });
        // place at end of wrapper
        const wrapper = container.querySelector('div');
        if (wrapper) wrapper.appendChild(btn);
    }
}

// Send a notification (uses Service Worker registration when available)
async function sendNotification(title, body, icon = './img/favicon-192.png', data = {}) {
    try {
        // Request permission if necessary
        if (Notification && Notification.permission !== 'granted') {
            try { await Notification.requestPermission(); } catch (e) { /* ignore */ }
        }

        if (Notification && Notification.permission === 'granted') {
            const reg = await navigator.serviceWorker.getRegistration();
            const options = { body: body || '', icon: icon, badge: icon, data };
            if (reg && reg.showNotification) {
                reg.showNotification(title || 'Notificación', options);
            } else {
                new Notification(title || 'Notificación', options);
            }
        } else {
            console.warn('Notificación no mostrada: permiso denegado o no disponible');
        }
    } catch (e) {
        console.error('Error en sendNotification:', e);
    }
}

// Remove all local messages (clear localStorage and UI)
function clearLocalMessages() {
    localStorage.removeItem(LOCAL_KEY);
    if (lista) lista.innerHTML = '<p>No hay mensajes guardados.</p>';
    const status = document.getElementById('sync-status');
    if (status) status.textContent = 'Mensajes locales eliminados.';
}

// Try to upload local messages to Firestore (manual sync triggered by user)
async function syncLocalToFirestoreManual() {
    const status = document.getElementById('sync-status');
    if (isSyncing) {
        if (status) status.textContent = 'Ya hay una sincronización en curso...';
        return;
    }
    isSyncing = true;
    try {
        const arr = JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]');
        if (!arr || !arr.length) {
            if (status) status.textContent = 'No hay mensajes locales para sincronizar.';
            isSyncing = false;
            return;
        }
        if (status) status.textContent = `Sincronizando ${arr.length} mensajes...`;

        // iterate from end so we keep chronological order when removing
        for (let i = arr.length - 1; i >= 0; i--) {
            const item = arr[i];
            // skip if already marked synced
            if (item && item.synced) continue;
            try {
                // mark uploading to avoid races
                arr[i].uploading = true;
                localStorage.setItem(LOCAL_KEY, JSON.stringify(arr));
                const docRef = await addDoc(collection(db, 'mensajes'), {
                    nombre: item.nombre,
                    mensaje: item.mensaje,
                    fecha: item.fecha || Date.now()
                });
                // Mark local item as synced and store remote id, clear uploading
                arr[i].synced = true;
                arr[i].remoteId = docRef.id;
                delete arr[i].uploading;
                // persist change immediately
                localStorage.setItem(LOCAL_KEY, JSON.stringify(arr));
                // update local UI element to show 'Sincronizado' and firebase-delete button
                updateLocalUIAfterSync(arr[i].id, docRef.id);
                // notify user that message synced
                try { sendNotification('Mensaje sincronizado', `${arr[i].nombre}: ${arr[i].mensaje}`); } catch (e) { console.warn('No se pudo notificar sync:', e); }
                if (status) status.textContent = `Sincronizado (restantes ${arr.filter(x=>!x.synced).length})...`;
            } catch (err) {
                console.error('Error subiendo item a Firestore:', err);
                // on permission-denied, stop and inform user
                if (err && err.code === 'permission-denied') {
                    if (status) status.textContent = `Error: permiso denegado al intentar subir a Firebase.`;
                    isSyncing = false;
                    return;
                }
                // otherwise continue with next
            }
        }
        // save remainder
        localStorage.setItem(LOCAL_KEY, JSON.stringify(arr));
        if (status) status.textContent = 'Sincronización completada.';
        // refresh UI: if there are remaining local messages, show them; otherwise keep the appended Firestore entries
        if (arr.length > 0) {
            loadLocalMessagesToUI();
        }
    } catch (e) {
        console.error('Error en syncLocalToFirestoreManual:', e);
        if (status) status.textContent = `Error sincronizando: ${e.message || e}`;
    }
    isSyncing = false;
}

// ===========================================
// LEER MENSAJES EN TIEMPO REAL (con fallback si orderBy falla)
// ===========================================
const lista = document.getElementById("lista-mensajes");

let unsubscribe = null;
// Prevent concurrent sync runs
let isSyncing = false;

function startListener(useOrderBy = true) {
    if (unsubscribe) {
        try { unsubscribe(); } catch (e) { console.warn('Error al anular escucha anterior:', e); }
        unsubscribe = null;
    }

    let qRef;
    try {
        qRef = useOrderBy ? query(collection(db, "mensajes"), orderBy("fecha", "desc")) : collection(db, "mensajes");
    } catch (e) {
        console.warn('Error creando query con orderBy:', e);
        // Si la creación de query falla, forzamos sin orderBy
        qRef = collection(db, "mensajes");
        useOrderBy = false;
    }

    console.log('Iniciando escucha de mensajes (orderBy=', useOrderBy, ')');

    unsubscribe = onSnapshot(qRef, (snapshot) => {
        console.log('onSnapshot recibido, docs:', snapshot.size);
        // Combine Firestore + local: do NOT remove localStorage entries on refresh.
        // If a local message exists with the same signature, prefer showing the local
        // message and skip rendering the Firestore duplicate. This preserves local messages across reloads.
        const localArr = JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]');
        const localSigs = new Set(localArr.map(it => `${it.nombre}||${it.mensaje}||${it.fecha}`));

        // Clear UI to render fresh
        lista.innerHTML = "";

        snapshot.forEach((d) => {
            const data = d.data();
            const sig = `${data.nombre}||${data.mensaje}||${data.fecha}`;
            // If a local copy exists, skip rendering this Firestore doc (keep local storage intact)
            if (localSigs.has(sig)) return;
            data._id = d.id;
            appendMessageToUI(data);
        });

        // Now append local messages so they remain visible (they won't be deleted by this handler)
        appendLocalMessagesToUI();

        if (snapshot.empty && localArr.length === 0) {
            lista.innerHTML = "<p>No hay mensajes guardados.</p>";
        }
    }, (err) => {
        console.error('onSnapshot error:', err);
        const code = err && err.code ? err.code : 'unknown';
        const msg = err && err.message ? err.message : String(err);
        lista.innerHTML = `<p>Error cargando mensajes: <strong>${code}</strong> - ${msg}</p>`;
        // Si el error es permiso denegado, activar modo local
        if (code === 'permission-denied') {
            enableLocalMode(`Firestore: ${code} - ${msg}`);
            return;
        }
        // Si falló por orderBy (p. ej. tipos mixtos en campo 'fecha'), reintentar sin orderBy
        if (useOrderBy) {
            console.log('Reintentando escucha SIN orderBy debido a error anterior...');
            startListener(false);
        }
    });
}

// Modo local cuando Firestore no permite acceso
let LOCAL_MODE = false;

// Habilitar modo local y cargar mensajes desde localStorage
function enableLocalMode(reason) {
    LOCAL_MODE = true;
    console.warn('Habilitando modo local:', reason);
    const authInfoEl = document.getElementById('auth-info');
    if (authInfoEl) authInfoEl.textContent = 'Modo local activo (Firestore no accesible)';
    loadLocalMessagesToUI();
}

// Arranque: no usamos autenticación. Intentar escuchar Firestore; si falla por permisos, activar modo local
startListener(true);

// Hook UI buttons
document.addEventListener('DOMContentLoaded', () => {
    const btnClear = document.getElementById('btn-clear-local');
    const btnSync = document.getElementById('btn-sync');
    const status = document.getElementById('sync-status');
    if (btnClear) btnClear.addEventListener('click', () => {
        if (!confirm('¿Eliminar todos los mensajes locales? Esta acción no afecta mensajes en Firebase.')) return;
        clearLocalMessages();
    });
    if (btnSync) btnSync.addEventListener('click', async () => {
        if (status) status.textContent = 'Iniciando sincronización...';
        await syncLocalToFirestoreManual();
    });
    // Load local messages on start
    loadLocalMessagesToUI();
    // Solicitar permiso de notificaciones en cuanto el usuario abra la app (si no fue ya concedido)
    try {
        if (Notification && Notification.permission === 'default') {
            Notification.requestPermission().then(p => console.log('Permiso notificaciones:', p));
        }
    } catch (e) { console.warn('No se pudo solicitar permiso de notificaciones:', e); }
    // Auto-sync: intentar enviar pendientes periódicamente y al reconectar
    try {
        // intentar cada 20 segundos
        setInterval(() => {
            syncLocalToFirestoreManual();
        }, 20000);
        // intentar al volver online
        window.addEventListener('online', () => {
            if (status) status.textContent = 'Conexión restablecida. Intentando sincronizar...';
            syncLocalToFirestoreManual();
        });
    } catch (e) {
        console.warn('No se pudo inicializar auto-sync:', e);
    }
});
