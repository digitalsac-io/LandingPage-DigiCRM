import { describe, expect, it } from "vitest";
import {
  generateTotpSecret,
  base32Decode,
  totpCode,
  verifyTotp,
  buildOtpauthUrl,
} from "../totp";

// RFC 6238 SHA-1 test vectors
// ASCII secret: "12345678901234567890"
// Base32 of that: GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ
const RFC_SECRET = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";

describe("base32Decode", () => {
  it("decodes the RFC 6238 ASCII secret correctly", () => {
    const buf = base32Decode(RFC_SECRET);
    // "12345678901234567890" as ASCII bytes
    const expected = Buffer.from("12345678901234567890", "ascii");
    expect(buf).toEqual(expected);
  });

  it("accepts lowercase input", () => {
    const buf = base32Decode(RFC_SECRET.toLowerCase());
    const expected = Buffer.from("12345678901234567890", "ascii");
    expect(buf).toEqual(expected);
  });

  it("ignores '=' padding", () => {
    // GEZDGNBVGY3TQOJQ is 16 base32 chars = 80 bits = 10 bytes = "1234567890"
    // Standard RFC 4648 padding would be "GEZDGNBVGY3TQOJQ======"
    const padded = "GEZDGNBVGY3TQOJQ======";
    const buf = base32Decode(padded);
    // 16 base32 chars → 10 bytes → "1234567890"
    const expected = Buffer.from("1234567890", "ascii");
    expect(buf).toEqual(expected);
  });

  it("ignores spaces", () => {
    const spaced = "GEZD GNBV GY3T QOJQ GEZD GNBV GY3T QOJQ";
    const buf = base32Decode(spaced);
    const expected = Buffer.from("12345678901234567890", "ascii");
    expect(buf).toEqual(expected);
  });
});

describe("totpCode — RFC 6238 vectors (6 digits)", () => {
  it("t=59s → 287082", () => {
    expect(totpCode(RFC_SECRET, 59 * 1000)).toBe("287082");
  });

  it("t=1111111109s → 081804", () => {
    expect(totpCode(RFC_SECRET, 1111111109 * 1000)).toBe("081804");
  });

  it("t=1234567890s → 005924", () => {
    expect(totpCode(RFC_SECRET, 1234567890 * 1000)).toBe("005924");
  });

  it("t=20000000000s → 353130", () => {
    expect(totpCode(RFC_SECRET, 20000000000 * 1000)).toBe("353130");
  });
});

describe("generateTotpSecret", () => {
  it("returns a string of 32 uppercase Base32 characters (20 bytes)", () => {
    const secret = generateTotpSecret();
    // 20 bytes → ceil(20/5)*8 = 32 Base32 chars (no padding)
    expect(secret).toMatch(/^[A-Z2-7]{32}$/);
  });

  it("round-trips: decode gives back 20 bytes", () => {
    const secret = generateTotpSecret();
    const decoded = base32Decode(secret);
    expect(decoded.length).toBe(20);
  });

  it("generates unique secrets", () => {
    const a = generateTotpSecret();
    const b = generateTotpSecret();
    expect(a).not.toBe(b);
  });
});

describe("verifyTotp", () => {
  // Use t=1234567890s (counter=41152263) — well away from t=0 edge cases
  const nowS = 1234567890;
  const now = nowS * 1000;
  const code = totpCode(RFC_SECRET, now); // "005924"

  it("accepts the correct code for the current window", () => {
    expect(verifyTotp(RFC_SECRET, code, now, 1)).toBe(true);
  });

  it("accepts code from offset -1 (previous step)", () => {
    const prevCode = totpCode(RFC_SECRET, (nowS - 30) * 1000);
    expect(verifyTotp(RFC_SECRET, prevCode, now, 1)).toBe(true);
  });

  it("accepts code from offset +1 (next step)", () => {
    const nextCode = totpCode(RFC_SECRET, (nowS + 30) * 1000);
    expect(verifyTotp(RFC_SECRET, nextCode, now, 1)).toBe(true);
  });

  it("rejects code from offset -2 when window=1", () => {
    const farPrevCode = totpCode(RFC_SECRET, (nowS - 60) * 1000);
    expect(verifyTotp(RFC_SECRET, farPrevCode, now, 1)).toBe(false);
  });

  it("rejects code from offset +2 when window=1", () => {
    const farNextCode = totpCode(RFC_SECRET, (nowS + 60) * 1000);
    expect(verifyTotp(RFC_SECRET, farNextCode, now, 1)).toBe(false);
  });

  it("rejects code with only 5 digits", () => {
    expect(verifyTotp(RFC_SECRET, "12345", now, 1)).toBe(false);
  });

  it("rejects non-numeric 6-char code", () => {
    expect(verifyTotp(RFC_SECRET, "abcdef", now, 1)).toBe(false);
  });
});

describe("buildOtpauthUrl", () => {
  it("returns correct otpauth URL format", () => {
    const url = buildOtpauthUrl(RFC_SECRET, "admin@example.com");
    expect(url).toBe(
      `otpauth://totp/DigitalSac%20Landing%3Aadmin%40example.com?secret=${RFC_SECRET}&issuer=DigitalSac%20Landing&algorithm=SHA1&digits=6&period=30`
    );
  });

  it("encodes @ in email in the path segment", () => {
    const url = buildOtpauthUrl(RFC_SECRET, "admin@example.com");
    // The path part (before ?) must contain %40 for the @
    const path = url.split("?")[0];
    expect(path).toContain("%40");
  });

  it("supports a custom issuer", () => {
    const url = buildOtpauthUrl(RFC_SECRET, "user@test.com", "MyApp");
    expect(url).toContain("issuer=MyApp");
    expect(url).toContain("otpauth://totp/MyApp%3Auser%40test.com");
  });
});
