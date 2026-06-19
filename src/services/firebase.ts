import './suppressLogs';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, doc, getDocFromServer, setLogLevel } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';
import firebaseConfig from '../../firebase-applet-config.json';

// Safety check for Firebase configuration to prevent blank page crashes on missing env
if (!firebaseConfig || !firebaseConfig.apiKey || firebaseConfig.apiKey === "REPLACE_WITH_YOUR_FIREBASE_API_KEY") {
  console.error("CRITICAL: Firebase configuration is missing or invalid. Check firebase-applet-config.json.");
  if (typeof window !== 'undefined') {
    // Optionally alert the user or show a fallback UI message in the DOM if we are at the very entry point
    document.addEventListener('DOMContentLoaded', () => {
      const root = document.getElementById('root');
      if (root && root.innerHTML.includes('Uhuru Market')) {
        root.innerHTML = `
          <div style="min-height: 100vh; background: #0A1628; color: white; display: flex; align-items: center; justify-content: center; padding: 20px; text-align: center; font-family: sans-serif;">
            <div>
              <h1 style="color: #C8102E;">Configuration Error</h1>
              <p>Firebase credentials not found. If this is a fresh Vercel deployment, ensure you have synced your project secrets.</p>
            </div>
          </div>
        `;
      }
    });
  }
}

const app = initializeApp(firebaseConfig);

// Silence verbose web channel stream cancellation logs for a clean console experience
if (typeof window !== 'undefined') {
  setLogLevel('silent');
}

export const db = initializeFirestore(
  app, 
  { 
    experimentalForceLongPolling: true
  },
  (firebaseConfig as any).firestoreDatabaseId
);
export const storage = getStorage(app);
export const auth = getAuth(app);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

/**
 * Determines if a Firestore error is a benign, expected behavior (like stream disconnection or idle timeout)
 * which the SDK will automatically recover from.
 */
export function isBenignFirestoreError(error: unknown): boolean {
  if (!error) return false;
  let msg = '';
  if (typeof error === 'string') {
    msg = error;
  } else if (error instanceof Error) {
    msg = `${error.name || ''} ${error.message || ''} ${error.stack || ''}`;
  } else {
    try {
      msg = JSON.stringify(error);
    } catch (e) {
      msg = '';
      for (const key of Object.keys(error as any)) {
        try {
          msg += ` ${key}:${(error as any)[key]}`;
        } catch (_) {}
      }
    }
  }
  
  const str = msg.toLowerCase();
  return (
    str.includes('disconnecting idle stream') ||
    str.includes('timed out waiting for new targets') ||
    str.includes('grpcconnection rpc') ||
    str.includes('cancelled') ||
    str.includes('code: 1') ||
    str.includes('cancel') ||
    str.includes('unreachable') ||
    str.includes('offline') ||
    str.includes('disconnecting') ||
    str.includes('idle stream') ||
    str.includes('grpc_connection') ||
    str.includes('listen stream')
  );
}

async function testConnection() {
  try {
    // Testing connection to a dummy path to verify Firestore is reachable
    await getDocFromServer(doc(db, 'system', 'connection-test'));
    console.log("Firestore connection successful");
  } catch (error) {
    if (isBenignFirestoreError(error)) return;
    console.error("Firestore connection test failed:", error);
    if (error instanceof Error && (error.message.includes('offline') || error.message.includes('reach'))) {
      console.error("Please check your Firebase configuration. The client appears to be offline or firewall is blocking connectivity.");
    }
  }
}

if (typeof window !== 'undefined') {
  testConnection();
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  // If this is a benign, self-recovering error (e.g., idle stream cancellation due to inactivity),
  // we do not log it as a critical error to prevent unnecessary log pollution or false system alarms.
  if (isBenignFirestoreError(error)) {
    return;
  }

  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  
  // Only throw fatal errors for modifications / write transactions.
  // Read/observation queries (GET, LIST) should be handled gracefully via local fallback states.
  if (
    operationType === OperationType.CREATE ||
    operationType === OperationType.UPDATE ||
    operationType === OperationType.DELETE ||
    operationType === OperationType.WRITE
  ) {
    throw new Error(JSON.stringify(errInfo));
  }
}
