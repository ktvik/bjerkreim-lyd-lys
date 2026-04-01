import CryptoJS from 'crypto-js';

const SECRET = import.meta.env.VITE_ENCRYPTION_SECRET || 'Bjerkreim-Lyd-Lys-Default-Secret-2026';

/**
 * Krypterer en streng
 * @param text - Klartekst
 * @returns - Kryptert streng (Base64)
 */
export const encryptData = (text: string): string => {
  if (!text) return '';
  return CryptoJS.AES.encrypt(text, SECRET).toString();
};

/**
 * Dekrypterer en streng
 * @param ciphertext - Kryptert tekst
 * @returns - Dekryptert klartekst
 */
export const decryptData = (ciphertext: string): string => {
  if (!ciphertext) return '';
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (e) {
    console.error("Dekryptering feilet. Sjekk hemmelig nøkkel.", e);
    return '';
  }
};
