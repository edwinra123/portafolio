import { promises as fs } from "fs";
import path from "path";
import type { WhatsAppOrder, WhatsAppOrderStatus } from "@/lib/types";

export type { WhatsAppOrder, WhatsAppOrderStatus };

const ORDERS_PATH = path.join(process.cwd(), "data", "whatsapp-orders.json");

async function ensureFile(): Promise<void> {
  try {
    await fs.access(ORDERS_PATH);
  } catch {
    await fs.mkdir(path.dirname(ORDERS_PATH), { recursive: true });
    await fs.writeFile(ORDERS_PATH, "[]", "utf8");
  }
}

export async function readWhatsAppOrders(): Promise<WhatsAppOrder[]> {
  await ensureFile();
  const raw = await fs.readFile(ORDERS_PATH, "utf8");
  try {
    return JSON.parse(raw) as WhatsAppOrder[];
  } catch {
    return [];
  }
}

export async function writeWhatsAppOrders(
  orders: WhatsAppOrder[]
): Promise<void> {
  await ensureFile();
  await fs.writeFile(ORDERS_PATH, JSON.stringify(orders, null, 2), "utf8");
}

export async function saveWhatsAppOrder(
  order: WhatsAppOrder
): Promise<WhatsAppOrder> {
  const orders = await readWhatsAppOrders();
  orders.unshift(order);
  await writeWhatsAppOrders(orders);
  return order;
}

export async function updateWhatsAppOrderStatus(
  id: string,
  status: WhatsAppOrderStatus
): Promise<WhatsAppOrder | null> {
  const orders = await readWhatsAppOrders();
  const idx = orders.findIndex((o) => o.id === id);
  if (idx === -1) return null;
  orders[idx] = {
    ...orders[idx],
    status,
    updatedAt: new Date().toISOString(),
  };
  await writeWhatsAppOrders(orders);
  return orders[idx];
}

export function createWhatsAppOrderId(): string {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `WA-${stamp}-${rand}`;
}

export function countOpenWhatsAppOrders(orders: WhatsAppOrder[]): number {
  return orders.filter((o) => o.status === "nuevo" || o.status === "preparar")
    .length;
}
