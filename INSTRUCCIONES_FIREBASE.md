# Configuración de Firebase Cloud Firestore para Sincronización en la Nube

Este documento describe los pasos para crear y configurar una base de datos en la nube usando **Firebase Cloud Firestore** para sincronizar toda la información de **DENUE PV** de forma cruzada en múltiples dispositivos.

---

## Paso 1: Crear un Proyecto en Firebase

1. Entra a la [Consola de Firebase](https://console.firebase.google.com/).
2. Inicia sesión con tu cuenta de Google.
3. Haz clic en **"Agregar proyecto"** (Add project).
4. Escribe el nombre del proyecto, por ejemplo: `DENUE PV Alchisa`.
5. Haz clic en **"Continuar"** y desmarca la opción de *Google Analytics* (no es necesaria para esta aplicación de prospección interna).
6. Haz clic en **"Crear proyecto"** y espera a que termine.

---

## Paso 2: Crear la Base de Datos de Firestore

1. Una vez dentro de tu panel del proyecto, ve al menú lateral izquierdo y haz clic en **"Build"** (Compilación) > **"Firestore Database"**.
2. Presiona el botón **"Crear base de datos"** (Create database).
3. Configura la base de datos:
   - **Ubicación de Firestore**: Elige una región cercana (por ejemplo, `nam5 (us-central)` o `us-east1`).
   - Haz clic en **Siguiente**.
4. **Reglas de Seguridad**:
   - Selecciona **"Iniciar en modo de prueba"** (Start in test mode). Esto permitirá realizar lecturas y escrituras de forma rápida para tus asesores comerciales.
   - *Nota: Para producción final, puedes limitar las reglas para que solo usuarios autenticados mediante Google OAuth escriban datos.*
5. Haz clic en **"Crear"** (Create).

---

## Paso 3: Registrar la Aplicación Web y Obtener las Claves

1. En la pantalla principal de tu proyecto de Firebase (puedes volver haciendo clic en el engrane superior junto a "Descripción general del proyecto" > **Configuración del proyecto**).
2. Ve a la parte inferior de la pestaña general en "Tus aplicaciones" y haz clic en el icono web **`</>`**.
3. Registra tu aplicación con el nombre: `DENUE PV Web`.
4. Deja desmarcada la opción de *Firebase Hosting* y haz clic en **Registrar app**.
5. Aparecerá un bloque de código que contiene el objeto `firebaseConfig`. Copia **únicamente** el objeto JSON que está dentro del inicializador:
   ```json
   {
     "apiKey": "AIzaSy...",
     "authDomain": "...",
     "projectId": "...",
     "storageBucket": "...",
     "messagingSenderId": "...",
     "appId": "..."
   }
   ```

---

## Paso 4: Conectar Firebase en DENUE PV

Tienes dos métodos rápidos para introducir tu objeto de configuración:

### Método A: En Caliente desde la Interfaz (Recomendado)
1. Abre la aplicación en tu navegador: [http://localhost:3001/](http://localhost:3001/)
2. En la pantalla de login, haz clic en el engrane **⚙️** de la esquina superior derecha del cuadro.
3. Selecciona la pestaña **"Firebase DB"**.
4. Pega el objeto JSON que copiaste en el Paso 3.
5. Haz clic en **"Conectar Nube"**.
6. La aplicación se reiniciará sola. Verás un indicador verde de **`NUBE (FIRESTORE)`** en la esquina superior izquierda del menú lateral.

### Método B: Mediante Archivo `.env` (Para despliegue final)
1. Abre el archivo [.env](file:///c:/Users/alan.olivares_alchis/.gemini/antigravity/scratch/denue-pv/.env) en la raíz del proyecto.
2. Copia tus claves en sus variables correspondientes:
   ```env
   VITE_FIREBASE_API_KEY=AIzaSy...
   VITE_FIREBASE_AUTH_DOMAIN=...
   VITE_FIREBASE_PROJECT_ID=...
   VITE_FIREBASE_STORAGE_BUCKET=...
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=...
   ```
3. Compila la aplicación de nuevo ejecutando:
   `npm run build`

---

## Si la Base de Datos de Firebase está Nueva y Vacía:
No te preocupes. La primera vez que cualquier usuario inicie sesión con la nube activa, la aplicación **detectará automáticamente que la base de datos está vacía y cargará de forma transparente los más de 40 negocios iniciales de Chihuahua** (Refaccionarias, Talleres, Gasolineras) y los perfiles de los asesores comerciales en tus colecciones de Cloud Firestore.
