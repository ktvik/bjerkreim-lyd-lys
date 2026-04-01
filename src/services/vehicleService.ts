import { db } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { logAppError } from './logService';
import { decryptData } from './encryptionService';

const FALLBACK_KEY = import.meta.env.VITE_APP_SVV_API_KEY || '6bb68ee3-15d1-4106-8501-b39a3d889197';
const BASE_URL = 'https://akfell-datautlevering.atlas.vegvesen.no/enkeltoppslag/kjoretoydata';

/**
 * Henter kjøretøydata fra Statens Vegvesen.
 * Merk: Kan kreve en CORS-proxy i nettleseren.
 */
export const fetchVehicleData = async (regNr: string): Promise<any> => {
  const cleanRegNr = regNr.toUpperCase().replace(/\s/g, '');
  
  // Prøv å hente aktiv nøkkel fra Firestore, ellers bruk fallback
  let apiKey = FALLBACK_KEY;
  try {
    const sDoc = await getDoc(doc(db, 'settings', 'global'));
    const data = sDoc.data();
    if (sDoc.exists() && data?.svvApiKey) {
      apiKey = decryptData(data.svvApiKey) || FALLBACK_KEY;
    }
  } catch (e) {
    console.warn("Kunne ikke hente API-nøkkel fra Firestore, bruker fallback.");
  }
  
  try {
    const url = `${BASE_URL}?kjennemerke=${cleanRegNr}`;
    const headers = {
      'SVV-Authorization': `${apiKey.substring(0, 5)}***`,
      'Accept': 'application/json'
    };
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'SVV-Authorization': apiKey,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.text();
      await logAppError('Vegvesen API', {
        message: `API Feil: ${response.status} ${response.statusText}`,
        type: 'error',
        source: 'SVV API',
        details: {
          url,
          status: response.status,
          statusText: response.statusText,
          responseBody: errorData,
          headers
        }
      });
      throw new Error(`API feilet med status ${response.status}`);
    }

    const data = await response.json();
    await saveVehicleFullData(cleanRegNr, data);
    return data;
  } catch (error: any) {
    const isNetworkError = error.message === 'Failed to fetch';
    await logAppError('VehicleService', {
      message: isNetworkError ? 'Nettverksfeil / CORS blokkert' : error.message,
      type: 'error',
      source: 'Fetch',
      details: {
        error: error.message,
        stack: error.stack,
        hint: isNetworkError ? 'Sjekk CORS-innstillinger eller internett.' : 'Internt system-kall feilet',
        regNr: cleanRegNr,
        baseUrl: BASE_URL
      }
    });
    throw error;
  }
};

/**
 * Lagrer hele JSON-objektet fra Vegvesenet i 'kjoretoy' samlingen.
 */
export const saveVehicleFullData = async (regNr: string, data: any): Promise<void> => {
  try {
    await setDoc(doc(db, 'kjoretoy', regNr), data);
  } catch (error: any) {
    await logAppError('Firestore Save', {
      message: 'Kunne ikke lagre full kjøretøydata',
      regNr,
      error: error.message
    });
  }
};
