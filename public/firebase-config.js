/* Configuración pública de Firebase (identificadores del cliente, no son secretos).
   La seguridad la dan las reglas de Firestore (firestore.d360.rules), no estas claves.
   Si se quita este archivo, la app vuelve al modo local sin sesiones en la nube. */
window.D360_NUBE = {
  apiKey: 'AIzaSyBercveP1qw07sWaRK_hfF5iRpRbv8mjDo',
  authDomain: 'aligndata-arcop.firebaseapp.com',
  projectId: 'aligndata-arcop',
  appId: '1:207868335090:web:c09136dbc10127c5e9516b',
  databaseId: 'd360',
  sdk: '10.14.1'
};
