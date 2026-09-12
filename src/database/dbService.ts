import { initializeApp, getApp, getApps } from 'firebase/app';
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  writeBatch,
  query,
  where,
  getDoc,
  onSnapshot,
  Firestore,
  DocumentReference
} from 'firebase/firestore';
import { getAuth, GoogleAuthProvider, signInWithPopup, Auth } from 'firebase/auth';
import { Empresa, PlanTrabajo, Asesor, Giro } from '../types';
import * as localDb from './localDb';

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

// 1. Resolve Firebase configuration from LocalStorage, Vite Env Variables or Built-in Default
export function getFirebaseConfig(): FirebaseConfig | null {
  const saved = localStorage.getItem('denue_pv_firebase_config');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed.apiKey && parsed.projectId) {
        return parsed as FirebaseConfig;
      }
    } catch (e) {}
  }

  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
  if (apiKey && projectId) {
    return {
      apiKey,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
      projectId,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: import.meta.env.VITE_FIREBASE_APP_ID || ''
    };
  }

  // Built-in Default Firebase Configuration (denue-pv-alchisa)
  return {
    apiKey: "AIzaSyCBufJdnzjmQ6dONuuWYLGXADQklsU2DRQ",
    authDomain: "denue-pv-alchisa.firebaseapp.com",
    projectId: "denue-pv-alchisa",
    storageBucket: "denue-pv-alchisa.firebasestorage.app",
    messagingSenderId: "229341443004",
    appId: "1:229341443004:web:a369a03e2ff3c9ccf5f1b9"
  };
}

const config = getFirebaseConfig();
let db: Firestore | null = null;
let auth: Auth | null = null;
let isFirebaseActive = false;

if (config) {
  try {
    const app = getApps().length === 0 ? initializeApp(config) : getApp();
    db = getFirestore(app);
    auth = getAuth(app);
    isFirebaseActive = true;
    console.log("🔥 Connected to Firebase Cloud Firestore and Firebase Auth successfully!");
  } catch (error) {
    console.error("❌ Failed to initialize Firebase App:", error);
  }
}

export function isCloudActive(): boolean {
  return isFirebaseActive && db !== null;
}

// --- FIREBASE AUTHENTICATION ENGINE ---

export async function loginWithFirebaseGoogle(): Promise<{ email: string; name: string; photoURL?: string } | null> {
  if (!auth) {
    alert("⚠️ Configuración de Firebase Cloud no activa.\n\nPega tu configuración en el ícono de engrane ⚙️ de la pantalla de Login.");
    return null;
  }

  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account'
    });
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    
    return {
      email: user.email || '',
      name: user.displayName || user.email?.split('@')[0] || 'Usuario',
      photoURL: user.photoURL || undefined
    };
  } catch (error: any) {
    console.error("Firebase Google Auth login failed:", error);
    if (error.code !== 'auth/popup-closed-by-user') {
      alert(`Error de autenticación Firebase Google: ${error.message}`);
    }
    return null;
  }
}

// --- CLOUD TO LOCAL CACHE SYNC ENGINE ---

// Copia en memoria de las empresas recién traídas de Firestore, válida para
// la sesión actual del navegador. Con miles de empresas (importaciones CSV
// acumuladas), JSON.stringify(list) puede superar la cuota de localStorage
// (~5-10MB por origen); cuando eso pasa, seguimos sirviendo datos reales y
// actualizados desde esta variable en vez de depender de un localStorage
// que puede haber quedado a medias o con datos de una sesión anterior.
let empresasMemCache: Empresa[] | null = null;

export async function syncCloudToLocal(): Promise<void> {
  if (!isCloudActive() || !db) return;
  try {
    // 1. Fetch companies
    const snapEmp = await getDocs(collection(db, 'empresas'));
    if (!snapEmp.empty) {
      const list: Empresa[] = [];
      snapEmp.forEach(d => list.push(d.data() as Empresa));
      empresasMemCache = list;
      try {
        localStorage.setItem('denue_pv_empresas', JSON.stringify(list));
      } catch (e) {
        console.warn('No se pudo cachear localmente la lista completa de empresas (excede la cuota de localStorage). Se sigue usando la copia en memoria de esta sesión, ya sincronizada con la nube.', e);
      }
    }

    // 2. Fetch advisors
    const snapAsesores = await getDocs(collection(db, 'asesores'));
    if (!snapAsesores.empty) {
      const list: Asesor[] = [];
      snapAsesores.forEach(d => list.push(d.data() as Asesor));
      localStorage.setItem('denue_pv_asesores', JSON.stringify(list));
    }

    // 3. Fetch Work Plans
    const snapPlans = await getDocs(collection(db, 'plan_trabajo'));
    if (!snapPlans.empty) {
      const list: PlanTrabajo[] = [];
      snapPlans.forEach(d => list.push(d.data() as PlanTrabajo));
      localStorage.setItem('denue_pv_plantrabajo', JSON.stringify(list));
    }
  } catch (err) {
    console.error("Sync cloud to local failed:", err);
  }
}

export async function initializeDb(): Promise<void> {
  localDb.initializeDb();
}

// --- REALTIME MULTI-USER SYNC ---

// Escucha cambios en vivo de la colección 'empresas' (cambio de estatus,
// asignación de asesor, nuevos registros, etc.) para que todos los usuarios
// conectados vean de inmediato lo que otros van modificando, sin tener que
// recargar la página. Devuelve una función para cancelar la suscripción.
export function subscribeToEmpresas(onChange: (empresas: Empresa[]) => void): () => void {
  if (!isCloudActive() || !db) {
    return () => {};
  }

  const unsubscribe = onSnapshot(
    collection(db, 'empresas'),
    snap => {
      const list: Empresa[] = [];
      snap.forEach(d => list.push(d.data() as Empresa));
      empresasMemCache = list;
      try {
        localStorage.setItem('denue_pv_empresas', JSON.stringify(list));
      } catch (e) {
        console.warn('No se pudo cachear localmente la lista de empresas tras una actualización en tiempo real.', e);
      }
      onChange(list);
    },
    err => {
      console.error('La suscripción en tiempo real a empresas falló:', err);
    }
  );

  return unsubscribe;
}

// Escucha cambios en vivo del propio perfil del asesor logueado (rol,
// ciudades asignadas, nombre, etc.). Sin esto, si un administrador edita a
// un asesor que ya tiene la sesión abierta, ese asesor se queda con los
// datos de cuando inició sesión (localStorage) hasta que cierre sesión y
// vuelva a entrar, aunque recargue la página.
export function subscribeToAsesor(asesorId: string, onChange: (asesor: Asesor) => void): () => void {
  if (!isCloudActive() || !db) {
    return () => {};
  }

  const unsubscribe = onSnapshot(
    doc(db, 'asesores', asesorId),
    snap => {
      if (snap.exists()) {
        onChange(snap.data() as Asesor);
      }
    },
    err => {
      console.error('La suscripción en tiempo real al asesor falló:', err);
    }
  );

  return unsubscribe;
}

// --- HYBRID CRUD DATA METHODS ---

export function getEmpresas(): Empresa[] {
  // Prioriza la copia en memoria recién sincronizada con la nube (ver
  // syncCloudToLocal); si todavía no hay una (p. ej. nube inactiva u
  // offline), cae al caché de localStorage/semilla local.
  return empresasMemCache ?? localDb.getEmpresas();
}

export function updateEmpresa(updatedEmpresa: Empresa): Empresa {
  let updated: Empresa;
  try {
    updated = localDb.updateEmpresa(updatedEmpresa);
  } catch (e) {
    console.warn('No se pudo persistir el cambio en la caché local (localStorage lleno). El cambio se conserva en memoria y se guarda en la nube.', e);
    updated = { ...updatedEmpresa, fechaActualizacion: new Date().toISOString() };
  }

  if (empresasMemCache) {
    empresasMemCache = empresasMemCache.map(e => e.id === updated.id ? updated : e);
  }

  if (isCloudActive() && db) {
    setDoc(doc(db, 'empresas', updatedEmpresa.id), updated).catch(err => {
      console.error("Cloud sync failed for updateEmpresa:", err);
    });
  }

  return updated;
}

export function addEmpresa(empresa: Empresa): Empresa {
  let updated: Empresa;
  try {
    updated = localDb.addEmpresa(empresa);
  } catch (e) {
    console.warn('No se pudo persistir la nueva empresa en la caché local (localStorage lleno). Se conserva en memoria y se guarda en la nube.', e);
    updated = { ...empresa, fechaActualizacion: new Date().toISOString() };
  }

  if (empresasMemCache) {
    empresasMemCache = [...empresasMemCache, updated];
  }

  if (isCloudActive() && db) {
    setDoc(doc(db, 'empresas', empresa.id), updated).catch(err => {
      console.error("Cloud sync failed for addEmpresa:", err);
    });
  }

  return updated;
}

// Firestore rechaza un writeBatch con más de 500 operaciones. Con catálogos
// de miles de empresas (ej. Talleres Mecánicos con >13,000 registros), un
// solo batch.delete() por todos los documentos truena silenciosamente
// (el error solo se veía en la consola), así que la nube nunca quedaba
// realmente vacía aunque la vista local sí. Aquí se trocea en lotes seguros.
const FIRESTORE_BATCH_LIMIT = 450;

async function deleteRefsInChunks(refs: DocumentReference[]): Promise<void> {
  if (refs.length === 0 || !db) return;
  const chunks: DocumentReference[][] = [];
  for (let i = 0; i < refs.length; i += FIRESTORE_BATCH_LIMIT) {
    chunks.push(refs.slice(i, i + FIRESTORE_BATCH_LIMIT));
  }
  await Promise.all(chunks.map(chunk => {
    const batch = writeBatch(db!);
    chunk.forEach(ref => batch.delete(ref));
    return batch.commit();
  }));
}

export async function deleteAllEmpresas(giro?: Giro): Promise<void> {
  let deletedIds = new Set<string>();
  if (giro) {
    deletedIds = new Set(getEmpresas().filter(e => e.giro === giro).map(e => e.id));
  }

  try {
    localDb.deleteAllEmpresas(giro);
  } catch (e) {
    console.warn('No se pudo actualizar la caché local al vaciar el catálogo (localStorage lleno). La eliminación en la nube continúa igual.', e);
  }

  if (empresasMemCache) {
    empresasMemCache = giro ? empresasMemCache.filter(e => e.giro !== giro) : [];
  }

  if (!isCloudActive() || !db) return;

  const empresasQuery = giro
    ? query(collection(db, 'empresas'), where('giro', '==', giro))
    : collection(db, 'empresas');
  const empSnap = await getDocs(empresasQuery);
  await deleteRefsInChunks(empSnap.docs.map(d => d.ref));

  const plansSnap = await getDocs(collection(db, 'plan_trabajo'));
  const planRefs = plansSnap.docs
    .filter(d => !giro || deletedIds.has(d.data().empresaId))
    .map(d => d.ref);
  await deleteRefsInChunks(planRefs);
}

export async function addEmpresasBulk(
  newEmpresas: Empresa[],
  onProgress?: (progressPercent: number, count: number) => void
): Promise<Empresa[]> {
  // 1. Always save to LocalStorage cache immediately (best-effort: con
  // catálogos grandes esto puede exceder la cuota de localStorage; si pasa,
  // seguimos con la copia en memoria y la nube, que es lo que de verdad
  // importa para que todos los asesores vean el catálogo actualizado)
  let updated: Empresa[];
  try {
    updated = localDb.addEmpresasBulk(newEmpresas);
  } catch (e) {
    console.warn('No se pudo persistir la carga masiva en la caché local (localStorage lleno). Se conserva en memoria y se guarda en la nube.', e);
    const dateStr = new Date().toISOString();
    updated = newEmpresas.map(e => ({ ...e, fechaActualizacion: dateStr }));
  }

  if (empresasMemCache) {
    empresasMemCache = [...empresasMemCache, ...updated];
  }

  // 2. Sync to Firebase Cloud Firestore in chunks of 450 (Firestore limit is 500 per batch)
  if (isCloudActive() && db) {
    const CHUNK_SIZE = 450;
    const total = updated.length;

    for (let i = 0; i < total; i += CHUNK_SIZE) {
      const chunk = updated.slice(i, i + CHUNK_SIZE);
      const batch = writeBatch(db);

      chunk.forEach(e => {
        const docRef = doc(db!, 'empresas', e.id);
        batch.set(docRef, e);
      });

      try {
        await batch.commit();
      } catch (err) {
        console.error(`Cloud sync failed for chunk ${i}-${i + CHUNK_SIZE}:`, err);
      }

      const processedCount = Math.min(i + CHUNK_SIZE, total);
      const percent = Math.round((processedCount / total) * 100);
      if (onProgress) {
        onProgress(percent, processedCount);
      }
    }
  } else {
    // If running only locally, call progress callback
    if (onProgress) {
      onProgress(100, updated.length);
    }
  }
  
  return updated;
}

export function getPlanTrabajo(): PlanTrabajo[] {
  return localDb.getPlanTrabajo();
}

export function savePlanTrabajo(plan: PlanTrabajo): PlanTrabajo {
  const updated = localDb.savePlanTrabajo(plan);
  
  if (isCloudActive() && db) {
    const cleanPlan = JSON.parse(JSON.stringify(updated));
    setDoc(doc(db, 'plan_trabajo', plan.id), cleanPlan).catch(err => {
      console.error("Cloud sync failed for savePlanTrabajo:", err);
    });

    const empDocRef = doc(db, 'empresas', plan.empresaId);
    getDoc(empDocRef).then(empSnap => {
      if (empSnap.exists()) {
        const current = empSnap.data() as Empresa;
        const updatedEmp = getEmpresas().find(e => e.id === plan.empresaId);
        setDoc(empDocRef, {
          ...current,
          estatus: updatedEmp?.estatus || current.estatus,
          vecesAgregadoAlPlan: updatedEmp?.vecesAgregadoAlPlan || current.vecesAgregadoAlPlan || 1,
          marcaCompetencia: plan.marcaCompetencia,
          fechaActualizacion: new Date().toISOString()
        });
      }
    }).catch(err => {
      console.error("Cloud sync failed for competitor brand sync:", err);
    });
  }
  
  return updated;
}

export function deletePlanTrabajoByEmpresa(empresaId: string): void {
  localDb.deletePlanTrabajoByEmpresa(empresaId);

  if (isCloudActive() && db) {
    const q = query(collection(db, 'plan_trabajo'), where('empresaId', '==', empresaId));
    getDocs(q).then(snap => {
      const batch = writeBatch(db!);
      snap.forEach(d => {
        batch.delete(d.ref);
      });
      batch.commit();
    }).catch(err => {
      console.error("Cloud delete plan failed:", err);
    });
  }
}

export function getAsesores(): Asesor[] {
  return localDb.getAsesores();
}

export function addAsesor(asesor: Asesor): Asesor {
  const updated = localDb.addAsesor(asesor);

  if (isCloudActive() && db) {
    setDoc(doc(db, 'asesores', asesor.id), asesor).catch(err => {
      console.error("Cloud sync failed for addAsesor:", err);
    });
  }

  return updated;
}

export function updateAsesor(asesor: Asesor): Asesor {
  const updated = localDb.updateAsesor(asesor);

  if (isCloudActive() && db) {
    setDoc(doc(db, 'asesores', asesor.id), asesor).catch(err => {
      console.error("Cloud sync failed for updateAsesor:", err);
    });
  }

  return updated;
}

export function deleteAsesor(id: string): void {
  try {
    localDb.deleteAsesor(id);
  } catch (e) {
    console.warn('No se pudo actualizar la caché local al eliminar al asesor (localStorage lleno). La actualización en la nube continúa igual.', e);
  }

  if (empresasMemCache) {
    empresasMemCache = empresasMemCache.map(e =>
      e.asesorId === id ? { ...e, asesorId: null, fechaActualizacion: new Date().toISOString() } : e
    );
  }

  if (isCloudActive() && db) {
    deleteDoc(doc(db, 'asesores', id)).catch(err => {
      console.error("Cloud delete asesor failed:", err);
    });

    // Update unassigned companies in Firestore
    const q = query(collection(db, 'empresas'), where('asesorId', '==', id));
    getDocs(q).then(snap => {
      if (!snap.empty) {
        const batch = writeBatch(db!);
        snap.forEach(d => {
          batch.update(d.ref, {
            asesorId: null,
            fechaActualizacion: new Date().toISOString()
          });
        });
        batch.commit();
      }
    }).catch(err => {
      console.error("Cloud update unassigned companies failed:", err);
    });
  }
}

export function resetDb(): void {
  localDb.resetDb();
  if (isCloudActive()) {
    console.log("🧹 Local cache cleared. Cloud collections in Firestore remain untouched.");
  }
}
