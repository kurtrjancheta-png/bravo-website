const SALT = new Uint8Array([80, 77, 65, 95, 66, 82, 65, 86, 79, 95, 67, 79, 77, 80, 65, 78, 89]); // "PMA_BRAVO_COMPANY"
const HEADER = "BULL_ENC:";
const HEADER_BYTES = new TextEncoder().encode(HEADER);

async function getKey(passphrase) {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(passphrase),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );
  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: SALT,
      iterations: 100000,
      hash: "SHA-256"
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptBytes(arrayBuffer, passphrase = 'AnaktiBAKA!') {
  const key = await getKey(passphrase);
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  
  const encryptedBytes = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv
    },
    key,
    arrayBuffer
  );

  // Combine: HEADER (9 bytes) + IV (12 bytes) + ciphertext
  const combined = new Uint8Array(HEADER_BYTES.length + iv.length + encryptedBytes.byteLength);
  combined.set(HEADER_BYTES, 0);
  combined.set(iv, HEADER_BYTES.length);
  combined.set(new Uint8Array(encryptedBytes), HEADER_BYTES.length + iv.length);
  
  return combined;
}

export async function decryptBytes(arrayBuffer, passphrase = 'AnaktiBAKA!') {
  const bytes = new Uint8Array(arrayBuffer);
  
  // Verify header
  if (bytes.length < HEADER_BYTES.length) {
    return arrayBuffer;
  }
  
  const headerCheck = bytes.slice(0, HEADER_BYTES.length);
  const headerStr = new TextDecoder().decode(headerCheck);
  if (headerStr !== HEADER) {
    // Not encrypted, return original data
    return arrayBuffer;
  }
  
  const key = await getKey(passphrase);
  const iv = bytes.slice(HEADER_BYTES.length, HEADER_BYTES.length + 12);
  const ciphertext = bytes.slice(HEADER_BYTES.length + 12);

  const decryptedBytes = await window.crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: iv
    },
    key,
    ciphertext
  );

  return decryptedBytes;
}
