# Configuración de Google OAuth 2.0 para Producción

Este documento detalla los pasos para obtener y configurar tu propio **Google Client ID** de modo que el inicio de sesión con cuentas reales de Google (por ejemplo, correos corporativos de Alchisa) quede completamente funcional y activo en **DENUE PV**.

---

## Paso 1: Crear un Proyecto en Google Cloud Console

1. Entra a [Google Cloud Console](https://console.cloud.google.com/).
2. Inicia sesión con tu cuenta de Google.
3. En la barra superior, haz clic en el selector de proyectos y selecciona **"Nuevo proyecto"** (New Project).
4. Dale un nombre identificable, por ejemplo: `DENUE PV Alchisa`, y haz clic en **"Crear"**.

---

## Paso 2: Configurar la Pantalla de Consentimiento de OAuth

Antes de generar credenciales, debes configurar la pantalla que verán los usuarios al iniciar sesión:

1. En el menú lateral izquierdo de la consola, navega a **API y servicios** (APIs & Services) > **Pantalla de consentimiento de OAuth** (OAuth consent screen).
2. Selecciona el tipo de usuario:
   - **Internal (Interno)**: Recomendado si tu cuenta pertenece a Google Workspace (dominio corporativo de Alchisa). Solo personas dentro de tu organización podrán acceder.
   - **External (Externo)**: Si deseas permitir el acceso a correos `@gmail.com` de prueba.
3. Haz clic en **Crear**.
4. Completa la información obligatoria de la app:
   - **Nombre de la aplicación**: `DENUE PV`
   - **Correo electrónico de soporte de usuario**: Tu correo.
   - **Logotipo de la aplicación**: (Opcional)
   - **Datos de contacto del desarrollador**: Tu correo.
5. Haz clic en **Guardar y continuar**.
6. En la pestaña de **Permisos** (Scopes), haz clic en **Agregar o quitar permisos**, marca los permisos básicos `.../auth/userinfo.email` y `.../auth/userinfo.profile`, y haz clic en **Actualizar**.
7. Guarda y continúa hasta regresar al panel principal.

---

## Paso 3: Crear Credenciales de Cliente OAuth (Web App)

1. En el menú izquierdo, navega a **API y servicios** > **Credenciales** (Credentials).
2. Haz clic en **+ Crear credenciales** (+ Create Credentials) en la barra superior y selecciona **ID de cliente de OAuth** (OAuth client ID).
3. En **Tipo de aplicación** (Application type), elige **Aplicación web** (Web application).
4. Asigna un nombre a la credencial, por ejemplo: `Cliente Local Host 3001`.
5. **MUY IMPORTANTE (Orígenes Autorizados)**:
   - Ubica la sección **Orígenes autorizados de JavaScript** (Authorized JavaScript origins).
   - Haz clic en **+ AGREGAR URI** e ingresa la dirección local exacta de desarrollo:
     `http://localhost:3001`
   - Si vas a desplegar la aplicación en producción (por ejemplo, en un dominio como `https://denue-pv.alchisa.com`), haz clic de nuevo en **+ AGREGAR URI** e ingresa esa URL.
   - *Nota: Google OAuth bloqueará la autenticación con error de "Origin Mismatch" si la dirección en el navegador no coincide exactamente con las URIs ingresadas aquí.*
6. Haz clic en **Crear**.
7. Copia el valor del **ID de cliente** (Client ID) generado (tiene un formato parecido a `xxxxxxxxxxxx-xxxxxxxxxxxxxxxx.apps.googleusercontent.com`).

---

## Paso 4: Activar el Client ID en la Aplicación

Tienes dos métodos fáciles para configurar tu Client ID en **DENUE PV**:

### Método A: En Caliente desde la Interfaz (Recomendado para pruebas rápidas)
1. Abre la aplicación en tu navegador: [http://localhost:3001/](http://localhost:3001/)
2. En la pantalla de login, haz clic en el engrane de ajustes **⚙️** en la esquina superior derecha del cuadro.
3. Pega el **ID de cliente** que copiaste de la consola de Google.
4. Presiona **Guardar**. La aplicación se reiniciará automáticamente y el botón de inicio de sesión de Google ya estará enlazado a tu proyecto de desarrollo de Google Cloud.

### Método B: Mediante Archivo `.env` (Recomendado para despliegue final)
1. Abre el archivo [.env](file:///c:/Users/alan.olivares_alchis/.gemini/antigravity/scratch/denue-pv/.env) en la raíz del proyecto.
2. Reemplaza el Client ID sandbox por tu ID real:
   ```env
   VITE_GOOGLE_CLIENT_ID=TU_CLIENT_ID_REAL_DE_GOOGLE
   ```
3. Ejecuta `npm run build` para compilar la aplicación para producción.
