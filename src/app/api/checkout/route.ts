import { NextResponse } from "next/server";
import { getProductById, store } from "@/lib/data";
import { createOrderId, saveOrder } from "@/lib/orders";
import { processCardPayment } from "@/lib/payment";
import type { CartItem, CustomerInfo, Order, PaymentMethod, Size } from "@/lib/types";

type CheckoutBody = {
  items: CartItem[];
  customer: CustomerInfo;
  paymentMethod: PaymentMethod;
  card?: {
    number: string;
    expiry: string;
    cvc: string;
    holderName: string;
  };
};

function isSize(value: string): value is Size {
  return ["XS", "S", "M", "L", "XL", "XXL"].includes(value);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CheckoutBody;
    const { items, customer, paymentMethod, card } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "El carrito está vacío." },
        { status: 400 }
      );
    }

    if (
      !customer?.name?.trim() ||
      !customer?.email?.trim() ||
      !customer?.phone?.trim() ||
      !customer?.address?.trim() ||
      !customer?.city?.trim()
    ) {
      return NextResponse.json(
        { error: "Completa los datos de envío." },
        { status: 400 }
      );
    }

    if (paymentMethod !== "card" && paymentMethod !== "cod") {
      return NextResponse.json(
        { error: "Método de pago inválido." },
        { status: 400 }
      );
    }

    const normalized: CartItem[] = [];
    for (const item of items) {
      const product = getProductById(item.productId);
      if (!product) {
        return NextResponse.json(
          { error: `Producto no encontrado: ${item.productId}` },
          { status: 400 }
        );
      }
      if (!isSize(item.size)) {
        return NextResponse.json(
          { error: "Talla inválida." },
          { status: 400 }
        );
      }
      const quantity = Number(item.quantity);
      if (!Number.isFinite(quantity) || quantity < 1 || quantity > 20) {
        return NextResponse.json(
          { error: "Cantidad inválida." },
          { status: 400 }
        );
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
    const shipping =
      subtotal >= store.shippingThreshold ? 0 : store.shippingCost;
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
      if (!card) {
        return NextResponse.json(
          { error: "Datos de tarjeta incompletos." },
          { status: 400 }
        );
      }
      const result = processCardPayment(card);
      if (!result.ok || !result.meta) {
        order = { ...order, status: "failed" };
        await saveOrder(order);
        return NextResponse.json(
          { error: result.error || "Pago rechazado.", order },
          { status: 402 }
        );
      }
      order = {
        ...order,
        status: "paid",
        card: result.meta,
      };
    }

    await saveOrder(order);
    return NextResponse.json({ order });
  } catch {
    return NextResponse.json(
      { error: "No se pudo crear el pedido." },
      { status: 500 }
    );
  }
}
