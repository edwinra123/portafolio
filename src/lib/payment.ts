import type { CardPaymentMeta } from "./types";

export type CardInput = {
  number: string;
  expiry: string;
  cvc: string;
  holderName: string;
};

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

/** Luhn check for demo card validation */
export function isValidCardNumber(number: string): boolean {
  const digits = digitsOnly(number);
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let n = Number(digits[i]);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

export function detectBrand(number: string): string {
  const d = digitsOnly(number);
  if (/^4/.test(d)) return "Visa";
  if (/^5[1-5]/.test(d) || /^2(2[2-9]|[3-6]|7[01])/.test(d)) return "Mastercard";
  if (/^3[47]/.test(d)) return "American Express";
  return "Tarjeta";
}

export function isValidExpiry(expiry: string): boolean {
  const m = expiry.trim().match(/^(\d{2})\s*\/\s*(\d{2})$/);
  if (!m) return false;
  const month = Number(m[1]);
  const year = 2000 + Number(m[2]);
  if (month < 1 || month > 12) return false;
  const now = new Date();
  const exp = new Date(year, month); // first day of next month
  return exp > now;
}

export function isValidCvc(cvc: string, brand: string): boolean {
  const d = digitsOnly(cvc);
  if (brand === "American Express") return d.length === 4;
  return d.length === 3;
}

/**
 * Simulated card payment gateway.
 * Accepts valid test cards (Luhn-valid). Numbers ending in 0000 fail for demo.
 * In production, replace with Wompi / Mercado Pago / PayU.
 */
export function processCardPayment(card: CardInput): {
  ok: boolean;
  error?: string;
  meta?: CardPaymentMeta;
} {
  const number = digitsOnly(card.number);
  const brand = detectBrand(number);

  if (!card.holderName.trim()) {
    return { ok: false, error: "Ingresa el nombre del titular." };
  }
  if (!isValidCardNumber(number)) {
    return { ok: false, error: "Número de tarjeta inválido." };
  }
  if (!isValidExpiry(card.expiry)) {
    return { ok: false, error: "Fecha de vencimiento inválida." };
  }
  if (!isValidCvc(card.cvc, brand)) {
    return { ok: false, error: "CVC inválido." };
  }
  if (number.endsWith("0000")) {
    return {
      ok: false,
      error: "Pago rechazado por el banco (tarjeta de prueba de rechazo).",
    };
  }

  const authCode = Math.random().toString(36).slice(2, 8).toUpperCase();
  return {
    ok: true,
    meta: {
      brand,
      last4: number.slice(-4),
      holderName: card.holderName.trim(),
      authCode,
      processedAt: new Date().toISOString(),
    },
  };
}
