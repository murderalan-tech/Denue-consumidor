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
  Firestore
} from 'firebase/firestore';
import { getAuth, GoogleAuthProvider, signInWithPopup, Auth } from 'firebase/auth';
import { Empresa, PlanTrabajo, Asesor } from '../types';
import { SEED_ASESORES, SEED_EMPRESAS } from './initialSeed';
import * as localDb from './localDb';

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

// 1. Resolve Firebase configuration from LocalStorage or Vite Env Variables
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

  return null;
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

export async function syncCloudToLocal(): Promise<void> {
  if (!isCloudActive() || !db) return;
  try {
    // 1. Fetch companies
    const snapEmp = await getDocs(collection(db, 'empresas'));
    if (!snapEmp.empty) {
      const list: Empresa[] = [];
      snapEmp.forEach(d => list.push(d.data() as Empresa));
      localStorage.setItem('denue_pv_empresas', JSON.stringify(list));
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

// --- HYBRID CRUD DATA METHODS ---

export function getEmpresas(): Empresa[] {
  return localDb.getEmpresas();
}

export function updateEmpresa(updatedEmpresa: Empresa): Empresa {
  const updated = localDb.updateEmpresa(updatedEmpresa);
  
  if (isCloudActive() && db) {
    setDoc(doc(db, 'empresas', updatedEmpresa.id), updated).catch(err => {
      console.error("Cloud sync failed for updateEmpresa:", err);
    });
  }
  
  return updated;
}

export function addEmpresa(empresa: Empresa): Empresa {
  const updated = localDb.addEmpresa(empresa);
  
  if (isCloudActive() && db) {
    setDoc(doc(db, 'empresas', empresa.id), updated).catch(err => {
      console.error("Cloud sync failed for addEmpresa:", err);
    });
  }
  
  return updated;
}

export function addEmpresasBulk(newEmpresas: Empresa[]): Empresa[] {
  const updated = localDb.addEmpresasBulk(newEmpresas);
  
  if (isCloudActive() && db) {
    const batch = writeBatch(db);
    updated.forEach(e => {
      const docRef = doc(db!, 'empresas', e.id);
      batch.set(docRef, e);
    });
    batch.commit().catch(err => {
      console.error("Cloud sync failed for addEmpresasBulk:", err);
    });
  }
  
  return updated;
}

export function getPlanTrabajo(): PlanTrabajo[] {
  return localDb.getPlanTrabajo();
}

export function savePlanTrabajo(plan: PlanTrabajo): PlanTrabajo {
  const updated = localDb.savePlanTrabajo(plan);
  
  if (isCloudActive() && db) {
    setDoc(doc(db, 'plan_trabajo', plan.id), updated).catch(err => {
      console.error("Cloud sync failed for savePlanTrabajo:", err);
    });

    const empDocRef = doc(db, 'empresas', plan.empresaId);
    getDoc(empDocRef).then(empSnap => {
      if (empSnap.exists()) {
        const current = empSnap.data() as Empresa;
        setDoc(empDocRef, {
          ...current,
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

export function deleteAsesor(id: string): void {
  localDb.deleteAsesor(id);

  if (isCloudActive() && db) {
    deleteDoc(doc(db, 'asesores', id)).catch(err => {
      console.error("Cloud delete asesor failed:", err);
    });
  }
}

export function resetDb(): void {
  localDb.resetDb();
  if (isCloudActive()) {
    console.log("🧹 Local cache cleared. Cloud collections in Firestore remain untouched.");
  }
}
