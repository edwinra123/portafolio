import { promises as fs } from "fs";
import path from "path";
import type { Order, OrderStatus } from "./types";

const ORDERS_PATH = path.join(process.cwd(), "data", "orders.json");

async function ensureOrdersFile(): Promise<void> {
  try {
    await fs.access(ORDERS_PATH);
  } catch {
    await fs.mkdir(path.dirname(ORDERS_PATH), { recursive: true });
    await fs.writeFile(ORDERS_PATH, "[]", "utf8");
  }
}

export async function readOrders(): Promise<Order[]> {
  await ensureOrdersFile();
  const raw = await fs.readFile(ORDERS_PATH, "utf8");
  try {
    return JSON.parse(raw) as Order[];
  } catch {
    return [];
  }
}

export async function writeOrders(orders: Order[]): Promise<void> {
  await ensureOrdersFile();
  await fs.writeFile(ORDERS_PATH, JSON.stringify(orders, null, 2), "utf8");
}

export async function getOrderById(id: string): Promise<Order | undefined> {
  const orders = await readOrders();
  return orders.find((o) => o.id === id);
}

export async function saveOrder(order: Order): Promise<Order> {
  const orders = await readOrders();
  orders.unshift(order);
  await writeOrders(orders);
  return order;
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
  adminNotes?: string
): Promise<Order | null> {
  const orders = await readOrders();
  const idx = orders.findIndex((o) => o.id === id);
  if (idx === -1) return null;
  orders[idx] = {
    ...orders[idx],
    status,
    updatedAt: new Date().toISOString(),
    adminNotes:
      adminNotes !== undefined ? adminNotes : orders[idx].adminNotes,
  };
  await writeOrders(orders);
  return orders[idx];
}

export function createOrderId(): string {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `MX-${stamp}-${rand}`;
}
