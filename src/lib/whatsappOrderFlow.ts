import { products, store } from "@/lib/data";
import { formatCOP } from "@/lib/format";
import type { ChatReply } from "@/lib/chatbot";
import type { Product, Size } from "@/lib/types";
import type { WhatsAppOrder } from "@/lib/types";
import {
  createWhatsAppOrderId,
  saveWhatsAppOrder,
} from "@/lib/whatsappOrders";

type OrderStep =
  | "idle"
  | "product"
  | "size"
  | "quantity"
  | "city"
  | "name"
  | "confirm";

type OrderDraft = {
  step: OrderStep;
  productName?: string;
  productSlug?: string;
  unitPrice?: number;
  size?: string;
  quantity?: number;
  city?: string;
  customerName?: string;
  updatedAt: number;
};

const SESSIONS = new Map<string, OrderDraft>();
const SESSION_TTL_MS = 1000 * 60 * 45;
const SIZES: Size[] = ["XS", "S", "M", "L", "XL", "XXL"];

function stripAccents(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function normalize(value: string): string {
  return stripAccents(value).toLowerCase().trim().replace(/\s+/g, " ");
}

function cleanSession(phone: string) {
  const current = SESSIONS.get(phone);
  if (!current) return;
  if (Date.now() - current.updatedAt > SESSION_TTL_MS) {
    SESSIONS.delete(phone);
  }
}

function setDraft(phone: string, draft: OrderDraft) {
  SESSIONS.set(phone, { ...draft, updatedAt: Date.now() });
}

function clearDraft(phone: string) {
  SESSIONS.delete(phone);
}

function findProduct(query: string): Product | undefined {
  const q = normalize(query);
  if (!q) return undefined;

  const exact = products.find((p) => normalize(p.name) === q);
  if (exact) return exact;

  const scored = products
    .map((product) => {
      const name = normalize(product.name);
      let score = 0;
      if (name.includes(q) || q.includes(name)) score += 4;
      for (const token of q.split(" ")) {
        if (token.length < 3) continue;
        if (name.includes(token)) score += 2;
      }
      if (product.stock > 0) score += 0.2;
      return { product, score };
    })
    .filter((item) => item.score >= 2)
    .sort((a, b) => b.score - a.score);

  return scored[0]?.product;
}

function parseSize(input: string): Size | undefined {
  const simple = normalize(input).toUpperCase().replace(/\s+/g, "");
  return SIZES.find((size) => size === simple);
}

function parseQuantity(input: string): number | undefined {
  const match = input.match(/\d{1,3}/);
  if (!match) return undefined;
  const value = Number(match[0]);
  if (!Number.isFinite(value) || value < 1 || value > 100) return undefined;
  return value;
}

function wantsCancel(simple: string): boolean {
  return /\b(cancelar|cancela|salir|no quiero|olvidalo|olvídalo)\b/.test(
    simple
  );
}

function wantsStartOrder(simple: string): boolean {
  return /\b(pedido|pedir|quiero pedir|hacer pedido|comprar|ordenar|nuevo pedido)\b/.test(
    simple
  );
}

function estimateShipping(subtotal: number): number {
  return subtotal >= store.shippingThreshold ? 0 : store.shippingCost;
}

function draftSummary(draft: OrderDraft): string {
  const qty = draft.quantity || 1;
  const price = draft.unitPrice || 55000;
  const subtotal = qty * price;
  const shipping = estimateShipping(subtotal);
  const total = subtotal + shipping;

  return [
    `• Producto: ${draft.productName}`,
    `• Talla: ${draft.size}`,
    `• Cantidad: ${qty}`,
    `• Ciudad: ${draft.city}`,
    `• Nombre: ${draft.customerName}`,
    `• Subtotal: ${formatCOP(subtotal)}`,
    `• Envío: ${shipping === 0 ? "Gratis" : formatCOP(shipping)}`,
    `• Total estimado: ${formatCOP(total)}`,
  ].join("\n");
}

async function finalizeOrder(
  phone: string,
  draft: OrderDraft
): Promise<ChatReply> {
  const qty = draft.quantity || 1;
  const unitPrice = draft.unitPrice || 55000;
  const subtotal = qty * unitPrice;
  const shipping = estimateShipping(subtotal);
  const total = subtotal + shipping;
  const now = new Date().toISOString();

  const order: WhatsAppOrder = {
    id: createWhatsAppOrderId(),
    createdAt: now,
    updatedAt: now,
    status: "nuevo",
    customerPhone: phone,
    customerName: draft.customerName || "Cliente WhatsApp",
    productName: draft.productName || "Uniforme",
    productSlug: draft.productSlug,
    size: draft.size || "M",
    quantity: qty,
    city: draft.city || store.city,
    unitPrice,
    shipping,
    total,
  };

  await saveWhatsAppOrder(order);
  clearDraft(phone);

  return {
    text: `✅ Pedido *${order.id}* registrado.\n\n${draftSummary({
      ...draft,
      quantity: qty,
      unitPrice,
    })}\n\nMedix lo verá en el panel para saber cuántos pedidos tiene que preparar. Si necesitas otro, escribe *pedido*.`,
    suggestions: ["Hacer pedido", "Ver productos", "Horario"],
  };
}

export function hasActiveWhatsAppOrder(phone: string): boolean {
  cleanSession(phone);
  const draft = SESSIONS.get(phone);
  return Boolean(draft && draft.step !== "idle");
}

/**
 * Handles WhatsApp order-taking conversation.
 * Returns null when the message should fall through to the FAQ chatbot.
 */
export async function handleWhatsAppOrderMessage(
  phone: string,
  rawText: string,
  contactName?: string
): Promise<ChatReply | null> {
  cleanSession(phone);
  const text = rawText.trim();
  const simple = normalize(text);
  if (!simple) return null;

  let draft = SESSIONS.get(phone);

  if (draft && wantsCancel(simple)) {
    clearDraft(phone);
    return {
      text: "Pedido cancelado. Si quieres empezar de nuevo, escribe *pedido*.",
      suggestions: ["Hacer pedido", "Ver productos", "Asesor"],
    };
  }

  if (!draft || draft.step === "idle") {
    if (!wantsStartOrder(simple)) {
      return null;
    }

    const maybeProduct = findProduct(
      simple
        .replace(/\b(pedido|pedir|quiero pedir|hacer pedido|comprar|ordenar|nuevo pedido)\b/g, "")
        .trim()
    );

    if (maybeProduct) {
      setDraft(phone, {
        step: "size",
        productName: maybeProduct.name,
        productSlug: maybeProduct.slug,
        unitPrice: maybeProduct.price,
        updatedAt: Date.now(),
      });
      return {
        text: `Perfecto, vamos a tomar tu pedido de *${maybeProduct.name}* (${formatCOP(maybeProduct.price)}).\n\n¿Qué talla? (XS, S, M, L, XL, XXL)\nEscribe *cancelar* si quieres salir.`,
        suggestions: ["S", "M", "L", "XL"],
      };
    }

    setDraft(phone, { step: "product", updatedAt: Date.now() });
    return {
      text: "Vamos a registrar tu pedido 📝\n\n¿Qué uniforme quieres? (ej: *uniforme azul*, *uniforme blanco*)\nEscribe *cancelar* para salir.",
      suggestions: ["Uniforme azul", "Uniforme blanco", "Uniforme amarillo"],
    };
  }

  if (draft.step === "product") {
    const product = findProduct(text);
    if (!product) {
      return {
        text: "No encontré ese modelo. Prueba con un color, por ejemplo: *uniforme azul*, *uniforme blanco* o *uniforme amarillo*.",
        suggestions: ["Uniforme azul", "Uniforme blanco", "Uniforme beich"],
      };
    }
    setDraft(phone, {
      ...draft,
      step: "size",
      productName: product.name,
      productSlug: product.slug,
      unitPrice: product.price,
    });
    return {
      text: `Listo: *${product.name}* (${formatCOP(product.price)}).\n¿Qué talla? (XS, S, M, L, XL, XXL)`,
      suggestions: ["S", "M", "L", "XL"],
    };
  }

  if (draft.step === "size") {
    const size = parseSize(text);
    if (!size) {
      return {
        text: "Dime una talla válida: XS, S, M, L, XL o XXL.",
        suggestions: ["S", "M", "L", "XL"],
      };
    }
    setDraft(phone, { ...draft, step: "quantity", size });
    return {
      text: `Talla *${size}*. ¿Cuántas unidades quieres?`,
      suggestions: ["1", "2", "3"],
    };
  }

  if (draft.step === "quantity") {
    const quantity = parseQuantity(text);
    if (!quantity) {
      return {
        text: "Escribe la cantidad en número, por ejemplo: *1* o *2*.",
        suggestions: ["1", "2", "3"],
      };
    }
    setDraft(phone, { ...draft, step: "city", quantity });
    return {
      text: "¿A qué ciudad lo enviamos?",
      suggestions: ["Cúcuta", "Bogotá", "Medellín"],
    };
  }

  if (draft.step === "city") {
    if (text.length < 2) {
      return {
        text: "Escribe el nombre de la ciudad de entrega.",
        suggestions: ["Cúcuta", "Bogotá", "Medellín"],
      };
    }
    setDraft(phone, { ...draft, step: "name", city: text });
    return {
      text: "¿A nombre de quién va el pedido?",
      suggestions: contactName ? [contactName.slice(0, 20)] : undefined,
    };
  }

  if (draft.step === "name") {
    if (text.length < 2) {
      return {
        text: "Escribe tu nombre para el pedido.",
      };
    }
    const next = { ...draft, step: "confirm" as const, customerName: text };
    setDraft(phone, next);
    return {
      text: `Confirma tu pedido:\n\n${draftSummary(next)}\n\nResponde *sí* para confirmar o *cancelar* para salir.`,
      suggestions: ["Sí", "Cancelar"],
    };
  }

  if (draft.step === "confirm") {
    if (/\b(si|sí|confirmo|ok|dale|confirmar)\b/.test(simple)) {
      return finalizeOrder(phone, draft);
    }
    if (wantsCancel(simple) || /\b(no)\b/.test(simple)) {
      clearDraft(phone);
      return {
        text: "No guardé el pedido. Escribe *pedido* cuando quieras intentar de nuevo.",
        suggestions: ["Hacer pedido", "Ver productos"],
      };
    }
    return {
      text: "Responde *sí* para confirmar el pedido o *cancelar* para salir.",
      suggestions: ["Sí", "Cancelar"],
    };
  }

  return null;
}
