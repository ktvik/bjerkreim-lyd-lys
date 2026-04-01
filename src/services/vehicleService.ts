import { db } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { logAppError } from './logService';
import { decryptData } from './encryptionService';

const FALLBACK_KEY = import.meta.env.VITE_APP_SVV_API_KEY || '6bb68ee3-15d1-4106-8501-b39a3d889197';
const BASE_URL = 'https://www.vegvesen.no/ws/no/vegvesen/kjoretoy/felles/datautlevering/enkeltoppslag/kjoretoydata';
const CORS_PROXY = 'https://corsproxy.io/?';

/**
 * Henter kjøretøydata fra Statens Vegvesen.
 * Merk: Bruker nå en CORS-proxy for å tillate oppslag fra GitHub Pages.
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
    const targetUrl = `${BASE_URL}?kjennemerke=${cleanRegNr}`;
    const url = `${CORS_PROXY}${encodeURIComponent(targetUrl)}`;
    
    const headers = {
      'SVV-Authorization': `Apikey ${apiKey.substring(0, 5)}***`,
      'Accept': 'application/json'
    };
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'SVV-Authorization': `Apikey ${apiKey}`,
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
          targetUrl,
          status: response.status,
          statusText: response.statusText,
          responseBody: errorData,
          headers
        }
      });
      throw new Error(`API feilet med status ${response.status}`);
    }

    const rawData = await response.json();
    const vehicle = rawData.kjoretoydataListe?.[0];
    
    if (!vehicle) {
      throw new Error("Ingen kjøretøy funnet med dette kjennetegnet.");
    }

    // Map Atlas-struktur til applikasjonens interne format (Compatibility Layer)
    const tech = vehicle.godkjenning?.tekniskGodkjenning?.tekniskeData;
    const pkk = vehicle.periodiskKjoretoyKontroll;
    
    const normalizedData: any = {
      tekniskeData: {
        vekt: {
          egenvektKg: tech?.vekter?.egenvekt || 0,
          tillattTotalvektKg: tech?.vekter?.tillattTotalvekt || 0
        },
        karosseri: {
          type: tech?.generelt?.tekniskKode?.kodeBeskrivelse || '',
          lengdeMm: tech?.dimensjoner?.lengde || 0,
          høydeMm: tech?.dimensjoner?.hoyde || 0
        }
      },
      // Utvidede felt for Vehicle interface
      extra: {
        width: Math.round((tech?.dimensjoner?.bredde || 0) / 10),
        make: tech?.generelt?.merke?.[0]?.merke || '',
        model: tech?.generelt?.handelsbetegnelse?.[0] || '',
        fuelType: tech?.miljodata?.miljoOgdrivstoffGruppe?.[0]?.drivstoffKodeMiljodata?.kodeNavn || '',
        euControlDeadline: pkk?.kontrollfrist || '',
        lastApproved: pkk?.sistGodkjent || '',
        mileage: vehicle.bruktImportInfo?.kilometerstand || 0,
        maxTotalWeight: tech?.vekter?.tillattTotalvekt || 0,
        trailerWeightWithBrake: tech?.vekter?.tillattTilhengervektMedBrems || 0,
        trailerWeightWithoutBrake: tech?.vekter?.tillattTilhengervektUtenBrems || 0,
        trainWeight: tech?.vekter?.tillattVogntogvekt || 0
      },
      raw: vehicle // Behold rådata for feilsøking
    };

    await saveVehicleFullData(cleanRegNr, rawData);
    return normalizedData;
  } catch (error: any) {
    const isNetworkError = error.message === 'Failed to fetch';
    await logAppError('VehicleService', {
      message: isNetworkError ? 'Nettverksfeil / CORS blokkert' : error.message,
      type: 'error',
      source: 'Fetch',
      details: {
        error: error.message,
        stack: error.stack,
        hint: isNetworkError ? 'Sjekk CORS-innstillinger, internett, eller om CORS-proxyen er nede.' : 'Internt system-kall feilet',
        regNr: cleanRegNr,
        baseUrl: BASE_URL,
        proxyUrl: CORS_PROXY
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
