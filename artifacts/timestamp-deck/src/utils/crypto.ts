import type { Project } from "../types";

type EncryptedPayload = {
  version: 1;
  type: "timestamp-deck-encrypted";
  salt: string;
  iv: string;
  ciphertext: string;
};

const PBKDF2_ITERATIONS = 600_000; // OWASP-recommended minimum for PBKDF2-SHA256
const MIN_PASSWORD_LENGTH = 8;

async function getKey(password: string, salt: Uint8Array) {
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256"
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptProject(
  project: Project,
  password: string
): Promise<EncryptedPayload> {
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(
      `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`
    );
  }

  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await getKey(password, salt);

  const data = enc.encode(JSON.stringify(project));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    data
  );

  return {
    version: 1,
    type: "timestamp-deck-encrypted",
    salt: btoa(String.fromCharCode(...salt)),
    iv: btoa(String.fromCharCode(...iv)),
    ciphertext: btoa(String.fromCharCode(...new Uint8Array(ciphertext)))
  };
}

export async function decryptProject(
  payload: EncryptedPayload,
  password: string
): Promise<Project> {
  if (payload.type !== "timestamp-deck-encrypted" || payload.version !== 1) {
    throw new Error("Unrecognized encrypted payload format.");
  }

  const dec = new TextDecoder();

  const salt = Uint8Array.from(atob(payload.salt), (c) => c.charCodeAt(0));
  const iv = Uint8Array.from(atob(payload.iv), (c) => c.charCodeAt(0));
  const ciphertext = Uint8Array.from(atob(payload.ciphertext), (c) =>
    c.charCodeAt(0)
  );

  const key = await getKey(password, salt);
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertext
  );

  return JSON.parse(dec.decode(decrypted));
}
