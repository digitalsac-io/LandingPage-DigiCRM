// TOTP core library — RFC 4226 + RFC 6238 (SHA-1, 6 digits, 30-second step)
// Dependencies: node:crypto only
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

// RFC 4648 Base32 alphabet (uppercase)
const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

/**
 * Generate a TOTP secret: 20 random bytes, Base32-encoded (RFC 4648, no padding, uppercase).
 */
export function generateTotpSecret(): string {
  const bytes = randomBytes(20);
  return base32Encode(bytes);
}

function base32Encode(buf: Buffer): string {
  let result = "";
  let bits = 0;
  let value = 0;

  for (let i = 0; i < buf.length; i++) {
    value = (value << 8) | buf[i];
    bits += 8;
    while (bits >= 5) {
      bits -= 5;
      result += BASE32_ALPHABET[(value >> bits) & 0x1f];
    }
  }

  // Remaining bits (less than 5)
  if (bits > 0) {
    result += BASE32_ALPHABET[(value << (5 - bits)) & 0x1f];
  }

  return result;
}

/**
 * Decode a Base32 string to a Buffer.
 * Accepts upper/lowercase, ignores '=' padding and spaces. RFC 4648 Base32.
 */
export function base32Decode(s: string): Buffer {
  // Normalize: uppercase, remove spaces and padding
  const cleaned = s.toUpperCase().replace(/[\s=]/g, "");

  const bytes: number[] = [];
  let bits = 0;
  let value = 0;

  for (const char of cleaned) {
    const idx = BASE32_ALPHABET.indexOf(char);
    if (idx === -1) {
      throw new Error(`Invalid Base32 character: ${char}`);
    }
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((value >> bits) & 0xff);
    }
  }

  return Buffer.from(bytes);
}

/**
 * Compute a TOTP code per RFC 4226 / RFC 6238.
 * @param secret  Base32-encoded HMAC-SHA1 key
 * @param timeMs  Current time in milliseconds
 * @param step    Time step in seconds (default 30)
 * @param digits  Number of OTP digits (default 6)
 */
export function totpCode(
  secret: string,
  timeMs: number,
  step = 30,
  digits = 6
): string {
  const counter = Math.max(0, Math.floor(timeMs / 1000 / step));
  const key = base32Decode(secret);

  // 8-byte big-endian counter
  const msg = Buffer.alloc(8);
  // JavaScript bitwise ops are 32-bit; handle upper 32 bits separately
  const hi = Math.floor(counter / 0x100000000);
  const lo = counter >>> 0;
  msg.writeUInt32BE(hi, 0);
  msg.writeUInt32BE(lo, 4);

  const hmac = createHmac("sha1", key).update(msg).digest();

  // Dynamic truncation per RFC 4226 §5.4
  const offset = hmac[19] & 0x0f;
  const code =
    (((hmac[offset] & 0x7f) << 24) |
      (hmac[offset + 1] << 16) |
      (hmac[offset + 2] << 8) |
      hmac[offset + 3]) %
    Math.pow(10, digits);

  return String(code).padStart(digits, "0");
}

/**
 * Verify a TOTP code against a secret, checking offsets in [-window, +window].
 * Uses timing-safe comparison.
 */
export function verifyTotp(
  secret: string,
  code: string,
  timeMs: number,
  window = 1
): boolean {
  // Reject non-6-digit or non-numeric codes
  if (code.length !== 6 || !/^\d{6}$/.test(code)) {
    return false;
  }

  const codeBuffer = Buffer.from(code, "utf8");

  for (let offset = -window; offset <= window; offset++) {
    const candidate = totpCode(secret, timeMs + offset * 30 * 1000);
    const candidateBuffer = Buffer.from(candidate, "utf8");
    if (timingSafeEqual(candidateBuffer, codeBuffer)) {
      return true;
    }
  }

  return false;
}

/**
 * Build an otpauth:// URL for QR code generation.
 * Format: otpauth://totp/{issuer}:{email}?secret={secret}&issuer={issuer}&algorithm=SHA1&digits=6&period=30
 */
export function buildOtpauthUrl(
  secret: string,
  email: string,
  issuer = "DigitalSac Landing"
): string {
  const encodedIssuer = encodeURIComponent(issuer);
  const encodedEmail = encodeURIComponent(email);
  const path = `${encodedIssuer}%3A${encodedEmail}`;

  const params = [
    `secret=${secret}`,
    `issuer=${encodedIssuer}`,
    `algorithm=SHA1`,
    `digits=6`,
    `period=30`,
  ].join("&");

  return `otpauth://totp/${path}?${params}`;
}
