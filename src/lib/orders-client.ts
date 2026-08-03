import { getProductById, store } from "@/lib/data";
import { processCardPayment, type CardInput } from "@/lib/payment";
import type {
  CartItem,
  CustomerInfo,
  Order,
  OrderStatus,
  PaymentMethod,
  Size,
} from "@/lib/types";

const ORDERS_KEY = "medixuniformes_orders";
const ADMIN_KEY = "medixuniformes_admin";

const SIZES: Size[] = ["XS", "S", "M", "L", "XL", "XXL"];

export function createOrderId(): string {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `MX-${stamp}-${rand}`;
}

export function readOrders(): Order[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ORDERS_KEY);
    return raw ? (JSON.parse(raw) as Order[]) : [];
  } catch {
    return [];
  }
}

export function writeOrders(orders: Order[]): void {
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
}

export function getOrderById(id: string): Order | undefined {
  return readOrders().find((o) => o.id === id);
}

export function saveOrder(order: Order): Order {
  const orders = readOrders();
  orders.unshift(order);
  writeOrders(orders);
  return order;
}

export function updateOrderStatus(
  id: string,
  status: OrderStatus,
  adminNotes?: string
): Order | null {
  const orders = readOrders();
  const idx = orders.findIndex((o) => o.id === id);
  if (idx === -1) return null;
  orders[idx] = {
    ...orders[idx],
    status,
    updatedAt: new Date().toISOString(),
    adminNotes:
      adminNotes !== undefined ? adminNotes : orders[idx].adminNotes,
  };
  writeOrders(orders);
  return orders[idx];
}

export function verifyAdminPassword(password: string): boolean {
  return password === (process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "medixadmin2026");
}

export function isAdminAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(ADMIN_KEY) === "1";
}

export function setAdminAuthenticated(value: boolean): void {
  if (value) localStorage.setItem(ADMIN_KEY, "1");
  else localStorage.removeItem(ADMIN_KEY);
}

export type CheckoutInput = {
  items: CartItem[];
  customer: CustomerInfo;
  paymentMethod: PaymentMethod;
  card?: CardInput;
};

export function checkoutOrder(input: CheckoutInput): {
  ok: boolean;
  error?: string;
  order?: Order;
} {
  const { items, customer, paymentMethod, card } = input;

  if (!items.length) return { ok: false, error: "El carrito está vacío." };
  if (
    !customer.name?.trim() ||
    !customer.email?.trim() ||
    !customer.phone?.trim() ||
    !customer.address?.trim() ||
    !customer.city?.trim()
  ) {
    return { ok: false, error: "Completa los datos de envío." };
  }
  if (paymentMethod !== "card" && paymentMethod !== "cod") {
    return { ok: false, error: "Método de pago inválido." };
  }

  const normalized: CartItem[] = [];
  for (const item of items) {
    const product = getProductById(item.productId);
    if (!product) {
      return { ok: false, error: `Producto no encontrado: ${item.productId}` };
    }
    if (!SIZES.includes(item.size)) {
      return { ok: false, error: "Talla inválida." };
    }
    const quantity = Number(item.quantity);
    if (!Number.isFinite(quantity) || quantity < 1 || quantity > 20) {
      return { ok: false, error: "Cantidad inválida." };
    }
    normalized.push({
      productId: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
      size: item.size,
      quantity,
    });
  }

  const subtotal = normalized.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const shipping = subtotal >= store.shippingThreshold ? 0 : store.shippingCost;
  const total = subtotal + shipping;
  const now = new Date().toISOString();

  let order: Order = {
    id: createOrderId(),
    createdAt: now,
    updatedAt: now,
    items: normalized,
    customer: {
      name: customer.name.trim(),
      email: customer.email.trim(),
      phone: customer.phone.trim(),
      address: customer.address.trim(),
      city: customer.city.trim(),
      notes: customer.notes?.trim() || "",
    },
    paymentMethod,
    status: paymentMethod === "cod" ? "cod_pending" : "pending_payment",
    subtotal,
    shipping,
    total,
  };

  if (paymentMethod === "card") {
    if (!card) return { ok: false, error: "Datos de tarjeta incompletos." };
    const result = processCardPayment(card);
    if (!result.ok || !result.meta) {
      order = { ...order, status: "failed" };
      saveOrder(order);
      return { ok: false, error: result.error || "Pago rechazado.", order };
    }
    order = { ...order, status: "paid", card: result.meta };
  }

  saveOrder(order);
  return { ok: true, order };
}
