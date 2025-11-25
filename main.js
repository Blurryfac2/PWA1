// service worker
// Desarrollo: si FORCE_CLEAN_SW = true, desregistrar todos los SW existentes y limpiar caches
// IMPORTANTE: en desarrollo poner true para forzar limpieza de SW/caches y evitar cache viejo
const FORCE_CLEAN_SW = true; // cambia a false cuando no quieras limpiar en cada recarga

function registerServiceWorker(){
    if ('serviceWorker' in navigator) {
        console.log('Puedes usar los service worker en tu navegador');
        navigator.serviceWorker.register('./sw.js')
            .then(res => console.log('✅ Service Worker registrado correctamente', res))
            .catch(err => console.log('❌ Service Worker no registrado', err));
    } else {
        console.log('No puedes usar los service worker en tu navegador');
    }
}

if (FORCE_CLEAN_SW && 'serviceWorker' in navigator && 'caches' in window) {
    // Desregistrar y borrar caches antes de registrar (útil en desarrollo)
    navigator.serviceWorker.getRegistrations()
    .then(registrations => Promise.all(registrations.map(r => r.unregister())))
    .then(() => caches.keys())
    .then(keys => Promise.all(keys.map(k => caches.delete(k))))
    .then(() => {
        console.log('✅ Service workers desregistrados y caches eliminadas.');
        registerServiceWorker();
    })
    .catch(err => {
        console.log('⚠️ Error limpiando SW/caches:', err);
        // Intentar registrar de todos modos
        registerServiceWorker();
    });
} else {
    registerServiceWorker();
}


//scroll suavizado
$(document).ready(function(){
    $("#menu a").click(function(e){
        e.preventDefault();
        $("html, body").animate({
            scrollTop: $($(this).attr('href')).offset().top
        });
        return false;
    });
});