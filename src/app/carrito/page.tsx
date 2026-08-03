"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { formatCOP } from "@/lib/format";
import { store } from "@/lib/data";

export default function CartPage() {
  const { items, subtotal, shipping, total, updateQuantity, removeItem } =
    useCart();

  if (items.length === 0) {
    return (
      <section className="container stack-page">
        <div className="empty-state panel">
          <h2>Tu carrito está vacío</h2>
          <p>Explora el catálogo y agrega tus uniformes.</p>
          <Link href="/uniformes" className="btn btn-primary" style={{ marginTop: "1rem" }}>
            Ver uniformes
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="container stack-page">
      <h1>Carrito</h1>
      <div className="cart-layout">
        <div className="panel">
          {items.map((item) => (
            <div
              className="cart-row"
              key={`${item.productId}-${item.size}`}
            >
              <div className="cart-thumb">
                <Image
                  src={item.imageUrl}
                  alt={item.name}
                  width={168}
                  height={168}
                />
              </div>
              <div>
                <strong style={{ color: "var(--navy)" }}>{item.name}</strong>
                <div className="product-meta">Talla {item.size}</div>
                <div className="product-price">{formatCOP(item.price)}</div>
                <div className="qty">
                  <button
                    type="button"
                    onClick={() =>
                      updateQuantity(item.productId, item.size, item.quantity - 1)
                    }
                  >
                    −
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() =>
                      updateQuantity(item.productId, item.size, item.quantity + 1)
                    }
                  >
                    +
                  </button>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <strong>{formatCOP(item.price * item.quantity)}</strong>
                <div>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    style={{ marginTop: "0.5rem", padding: "0.4rem 0.6rem" }}
                    onClick={() => removeItem(item.productId, item.size)}
                  >
                    Quitar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <aside className="panel">
          <h2 style={{ color: "var(--navy)", marginBottom: "0.75rem" }}>
            Resumen
          </h2>
          <div className="summary-line">
            <span>Subtotal</span>
            <span>{formatCOP(subtotal)}</span>
          </div>
          <div className="summary-line">
            <span>Envío</span>
            <span>{shipping === 0 ? "Gratis" : formatCOP(shipping)}</span>
          </div>
          {shipping > 0 && (
            <div className="alert alert-info">
              Envío gratis desde {formatCOP(store.shippingThreshold)}
            </div>
          )}
          <div className="summary-total">
            <span>Total</span>
            <span>{formatCOP(total)}</span>
          </div>
          <Link
            href="/checkout"
            className="btn btn-primary"
            style={{ width: "100%", marginTop: "1rem" }}
          >
            Ir a pagar
          </Link>
        </aside>
      </div>
    </section>
  );
}
