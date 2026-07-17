const onlyDigits = (s: string) => s.replace(/\D/g, "");

function cpfCheckDigit(digits: string, factor: number): number {
  let sum = 0;
  for (const d of digits) sum += Number(d) * factor--;
  const rest = (sum * 10) % 11;
  return rest === 10 ? 0 : rest;
}

export function isValidCpf(value: string): boolean {
  const cpf = onlyDigits(value);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  const d1 = cpfCheckDigit(cpf.slice(0, 9), 10);
  const d2 = cpfCheckDigit(cpf.slice(0, 10), 11);
  return d1 === Number(cpf[9]) && d2 === Number(cpf[10]);
}

function cnpjCheckDigit(digits: string): number {
  const weights = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const slice = weights.slice(weights.length - digits.length);
  let sum = 0;
  for (let i = 0; i < digits.length; i++) sum += Number(digits[i]) * slice[i];
  const rest = sum % 11;
  return rest < 2 ? 0 : 11 - rest;
}

export function isValidCnpj(value: string): boolean {
  const cnpj = onlyDigits(value);
  if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false;
  const d1 = cnpjCheckDigit(cnpj.slice(0, 12));
  const d2 = cnpjCheckDigit(cnpj.slice(0, 13));
  return d1 === Number(cnpj[12]) && d2 === Number(cnpj[13]);
}

export function isValidDocument(value: string): boolean {
  const digits = onlyDigits(value);
  if (digits.length === 11) return isValidCpf(digits);
  if (digits.length === 14) return isValidCnpj(digits);
  return false;
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}

export function normalizePhone(value: string): string | null {
  const digits = onlyDigits(value);
  return digits.length >= 10 && digits.length <= 15 ? digits : null;
}

export function isStrongPassword(value: string): boolean {
  return value.length >= 8 && /[a-zA-Z]/.test(value) && /\d/.test(value);
}
