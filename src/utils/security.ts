/**
 * Client-side cryptographic helper to secure and hash sensitive data (like phone numbers)
 * without ever sending them to a server.
 * Uses a unique user-specific private key stored strictly in localStorage.
 */

// Retrieve or generate a unique 32-character key for this user
export function getOrCreateUserPrivateKey(): string {
  if (typeof window === "undefined") return "default-sentinel-fallback-key-32";
  
  let key = localStorage.getItem("sentinel_secure_user_key");
  if (!key) {
    // Generate a secure pseudo-random unique key
    const array = new Uint8Array(16);
    if (window.crypto && window.crypto.getRandomValues) {
      window.crypto.getRandomValues(array);
    } else {
      for (let i = 0; i < 16; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
    }
    key = Array.from(array, byte => byte.toString(16).padStart(2, "0")).join("");
    localStorage.setItem("sentinel_secure_user_key", key);
  }
  return key;
}

/**
 * Standard RC4 / Custom symmetric stream cipher for highly efficient synchronous 
 * client-side encryption (mimicking AES/DES for lightweight state machines)
 */
export function encryptPhoneNumber(phone: string, key: string): string {
  if (!phone) return "";
  
  // Clean phone input of spaces/hyphens
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, "");
  
  // RC4 stream encryption
  const s = new Array(256);
  for (let i = 0; i < 256; i++) {
    s[i] = i;
  }
  
  let j = 0;
  for (let i = 0; i < 256; i++) {
    j = (j + s[i] + key.charCodeAt(i % key.length)) % 256;
    // Swap
    const temp = s[i];
    s[i] = s[j];
    s[j] = temp;
  }
  
  let i = 0;
  j = 0;
  const encryptedBytes: string[] = [];
  
  for (let k = 0; k < cleanPhone.length; k++) {
    i = (i + 1) % 256;
    j = (j + s[i]) % 256;
    // Swap
    const temp = s[i];
    s[i] = s[j];
    s[j] = temp;
    
    const keystreamByte = s[(s[i] + s[j]) % 256];
    const cipherByte = cleanPhone.charCodeAt(k) ^ keystreamByte;
    encryptedBytes.push(cipherByte.toString(16).padStart(2, "0"));
  }
  
  return "ENC_" + encryptedBytes.join("").toUpperCase();
}

/**
 * Decrypts the phone number locally for rendering
 */
export function decryptPhoneNumber(encryptedHex: string, key: string): string {
  if (!encryptedHex || !encryptedHex.startsWith("ENC_")) return encryptedHex;
  
  const hex = encryptedHex.replace("ENC_", "");
  const bytes: number[] = [];
  for (let c = 0; c < hex.length; c += 2) {
    bytes.push(parseInt(hex.substr(c, 2), 16));
  }
  
  // RC4 key schedule
  const s = new Array(256);
  for (let i = 0; i < 256; i++) {
    s[i] = i;
  }
  
  let j = 0;
  for (let i = 0; i < 256; i++) {
    j = (j + s[i] + key.charCodeAt(i % key.length)) % 256;
    // Swap
    const temp = s[i];
    s[i] = s[j];
    s[j] = temp;
  }
  
  let i = 0;
  j = 0;
  const decryptedChars: string[] = [];
  
  for (let k = 0; k < bytes.length; k++) {
    i = (i + 1) % 256;
    j = (j + s[i]) % 256;
    // Swap
    const temp = s[i];
    s[i] = s[j];
    s[j] = temp;
    
    const keystreamByte = s[(s[i] + s[j]) % 256];
    const plainChar = String.fromCharCode(bytes[k] ^ keystreamByte);
    decryptedChars.push(plainChar);
  }
  
  return decryptedChars.join("");
}

interface SavedImportantContact {
  name: string;
  category: "family" | "office" | "friends" | "others";
}

export function getSavedImportantContacts(): SavedImportantContact[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem("sentinel_settings");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.importantContacts) {
        return parsed.importantContacts;
      }
    }
  } catch (e) {
    console.error(e);
  }
  return [];
}

/**
 * Simple filtering logic to detect permitted categories
 * Allowed categories: mom, dad, relatives, office, colleagues, manager, friends, etc.
 * Also checks dynamic custom added important contacts rules.
 */
export function isCallLogPermitted(name: string): boolean {
  const lowerName = name.toLowerCase();
  
  // 1. Check custom dynamic rules first
  const dynamicContacts = getSavedImportantContacts();
  const matchedDynamic = dynamicContacts.find(c => 
    lowerName.includes(c.name.toLowerCase()) || c.name.toLowerCase().includes(lowerName)
  );
  if (matchedDynamic) return true;

  // 2. Fallback to hardcoded keywords
  const keywords = [
    "mom", "mother", "maa", "mummy", "mother-in-law", "mum",
    "dad", "father", "papa", "pitaji", "father-in-law",
    "relative", "uncle", "aunty", "aunt", "cousin", "grandpa", "grandma",
    "sister", "brother", "behen", "didi", "bhai", "bhaiya",
    "office", "colleague", "manager", "boss", "team lead", "sir", "ankit", "hr",
    "friend", "yaar", "buddy", "dost"
  ];
  
  return keywords.some(keyword => lowerName.includes(keyword));
}

/**
 * Normalizes name to category tag
 */
export function detectCallerRole(name: string): string {
  const lower = name.toLowerCase();

  // 1. Check custom dynamic rules first
  const dynamicContacts = getSavedImportantContacts();
  const matchedDynamic = dynamicContacts.find(c => 
    lower.includes(c.name.toLowerCase()) || c.name.toLowerCase().includes(lower)
  );
  if (matchedDynamic) {
    return matchedDynamic.category; // "family" | "office" | "friends" | "others"
  }

  // 2. Fallback to hardcoded defaults
  if (lower.includes("mom") || lower.includes("mother") || lower.includes("maa") || lower.includes("mummy")) return "mom";
  if (lower.includes("dad") || lower.includes("father") || lower.includes("papa")) return "dad";
  if (lower.includes("sister") || lower.includes("behen") || lower.includes("didi")) return "sister";
  if (lower.includes("brother") || lower.includes("bhai") || lower.includes("bhaiya")) return "brother";
  if (lower.includes("manager") || lower.includes("ankit")) return "manager";
  if (lower.includes("boss") || lower.includes("sir")) return "boss";
  if (lower.includes("colleague") || lower.includes("office") || lower.includes("hr")) return "colleague";
  if (lower.includes("friend") || lower.includes("yaar") || lower.includes("buddy") || lower.includes("dost")) return "friend";
  if (lower.includes("relative") || lower.includes("uncle") || lower.includes("aunty") || lower.includes("cousin")) return "relative";
  if (lower.includes("home")) return "home";
  return "other";
}
