const STORAGE_PREFIX = "gym:biometric";

type BiometricCredential = {
  credentialId: string;
};

const toBase64Url = (bytes: Uint8Array): string => {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
};

const fromBase64Url = (value: string): Uint8Array => {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
};

const getKey = (userId: string) => `${STORAGE_PREFIX}:${userId}`;

export const hasBiometricSupport = () =>
  typeof window !== "undefined" &&
  typeof window.PublicKeyCredential !== "undefined" &&
  typeof navigator.credentials !== "undefined";

export const getBiometricCredential = (userId: string): BiometricCredential | null => {
  const raw = localStorage.getItem(getKey(userId));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as BiometricCredential;
    if (!parsed?.credentialId) return null;
    return parsed;
  } catch {
    return null;
  }
};

const setBiometricCredential = (userId: string, credential: BiometricCredential) => {
  localStorage.setItem(getKey(userId), JSON.stringify(credential));
};

export const clearBiometricCredential = (userId: string) => {
  localStorage.removeItem(getKey(userId));
};

export const enrollBiometricCredential = async (userId: string, email?: string | null): Promise<boolean> => {
  if (!hasBiometricSupport()) return false;

  const challenge = crypto.getRandomValues(new Uint8Array(32));
  const userBytes = new TextEncoder().encode(userId);

  const created = await navigator.credentials.create({
    publicKey: {
      challenge,
      rp: { name: "Gym" },
      user: {
        id: userBytes,
        name: email ?? userId,
        displayName: email ?? "Gym user",
      },
      pubKeyCredParams: [
        { type: "public-key", alg: -7 },
        { type: "public-key", alg: -257 },
      ],
      timeout: 60_000,
      attestation: "none",
      authenticatorSelection: {
        userVerification: "required",
        residentKey: "preferred",
      },
    },
  });

  if (!created || created.type !== "public-key") return false;
  const credentialId = toBase64Url(new Uint8Array((created as PublicKeyCredential).rawId));
  setBiometricCredential(userId, { credentialId });
  return true;
};

export const authenticateWithBiometric = async (userId: string): Promise<boolean> => {
  if (!hasBiometricSupport()) return false;
  const credential = getBiometricCredential(userId);
  if (!credential) return false;

  const assertion = await navigator.credentials.get({
    publicKey: {
      challenge: crypto.getRandomValues(new Uint8Array(32)),
      allowCredentials: [],
      userVerification: "required",
      timeout: 45_000,
    },
  });

  return !!assertion;
};
