export function onlyDigits(value: string) {
  return value.replace(/\D/g, '');
}

export function maskPhone(value: string) {
  const digits = onlyDigits(value).slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
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
