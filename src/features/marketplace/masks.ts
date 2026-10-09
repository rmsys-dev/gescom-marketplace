export function onlyDigits(value: string) {
  return value.replace(/\D/g, '');
}

export function maskPhone(value: string) {
  const digits = onlyDigits(value).slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

/** Converte celular BR mascarado para E.164 (`+55...`). Vazio retorna undefined. */
export function toE164Phone(value: string) {
  const digits = onlyDigits(value);
  if (!digits) return undefined;
  if (digits.startsWith('55') && digits.length >= 12) return `+${digits}`;
  return `+55${digits}`;
}

export function maskCpfCnpj(value: string) {
  const digits = onlyDigits(value).slice(0, 14);
  if (digits.length <= 11) {
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) {
      return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    }
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  }
  if (digits.length <= 12) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  }
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
}

function cpfCheckDigits(digits: string) {
  const nums = digits.split('').map(Number);
  let sum = 0;
  for (let i = 0; i < 9; i += 1) sum += nums[i]! * (10 - i);
  let d1 = (sum * 10) % 11;
  if (d1 === 10) d1 = 0;
  if (d1 !== nums[9]) return false;
  sum = 0;
  for (let i = 0; i < 10; i += 1) sum += nums[i]! * (11 - i);
  let d2 = (sum * 10) % 11;
  if (d2 === 10) d2 = 0;
  return d2 === nums[10];
}

function cnpjCheckDigits(digits: string) {
  const nums = digits.split('').map(Number);
  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 12; i += 1) sum += nums[i]! * w1[i]!;
  let d1 = sum % 11;
  d1 = d1 < 2 ? 0 : 11 - d1;
  if (d1 !== nums[12]) return false;
  sum = 0;
  for (let i = 0; i < 13; i += 1) sum += nums[i]! * w2[i]!;
  let d2 = sum % 11;
  d2 = d2 < 2 ? 0 : 11 - d2;
  return d2 === nums[13];
}

export function isValidCpfCnpj(value: string) {
  const digits = onlyDigits(value);
  if (digits.length === 11) {
    if (/^(\d)\1+$/.test(digits)) return false;
    return cpfCheckDigits(digits);
  }
  if (digits.length === 14) {
    if (/^(\d)\1+$/.test(digits)) return false;
    return cnpjCheckDigits(digits);
  }
  return false;
}

export function resolveLoginType(login: string): {
  loginType: 'EMAIL' | 'CPF/CNPJ';
  login: string;
} {
  const trimmed = login.trim();
  if (trimmed.includes('@')) {
    return { loginType: 'EMAIL', login: trimmed.toLowerCase() };
  }
  return { loginType: 'CPF/CNPJ', login: onlyDigits(trimmed) };
}

export function maskZip(value: string) {
  const digits = onlyDigits(value).slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

export function maskCardNumber(value: string) {
  return onlyDigits(value)
    .slice(0, 16)
    .replace(/(\d{4})(?=\d)/g, '$1 ')
    .trim();
}

export function maskExpiry(value: string) {
  const digits = onlyDigits(value).slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export function nameFromEmail(email: string) {
  const local = email.split('@')[0] ?? '';
  const words = local
    .replace(/[._-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!words) return 'Cliente';
  return words.replace(/\b\p{L}/gu, (letter) => letter.toLocaleUpperCase('pt-BR'));
}

export function safeNextPath(value: string | null | undefined, fallback = '/conta') {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return fallback;
  return value;
}
