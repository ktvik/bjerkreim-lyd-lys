import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Logger feil til Firestore-samlingen 'system_logs'
 * @param errorContext - Hvor feilen skjedde (f.eks. "Vegvesen API")
 * @param errorDetails - Detaljer om feilen (message, status, regNr, etc.)
 */
export const logAppError = async (errorContext: string, errorDetails: any): Promise<void> => {
  try {
    await addDoc(collection(db, 'system_logs'), {
      context: errorContext,
      message: errorDetails.message || 'Ukjent feil',
      type: errorDetails.type || 'error',
      source: errorDetails.source || errorContext,
      details: errorDetails.details || null,
      timestamp: serverTimestamp(),
    });
    console.error(`[${errorContext}]`, errorDetails);
  } catch (e) {
    console.error("Kunne ikke logge feil til Firestore:", e);
  }
};
