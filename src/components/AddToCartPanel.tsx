"use client";

import { useState } from "react";
import Link from "next/link";
import type { Product, Size } from "@/lib/types";
import { useCart } from "@/context/CartContext";

export function AddToCartPanel({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [size, setSize] = useState<Size>("M");
  const [qty, setQty] = useState(1);
  const [msg, setMsg] = useState("");

  const onAdd = () => {
    addItem(product, size, qty);
    setMsg(`Agregado: ${product.name} · talla ${size}`);
  };

  return (
    <div>
      <strong style={{ color: "var(--navy)" }}>Talla</strong>
      <div className="size-grid" role="group" aria-label="Tallas">
        {product.sizes.map((s) => (
          <button
            key={s}
            type="button"
            className="size-btn"
            aria-pressed={size === s}
            onClick={() => setSize(s)}
          >
            {s}
          </button>
        ))}
      </div>

      <strong style={{ color: "var(--navy)" }}>Cantidad</strong>
      <div className="qty" style={{ margin: "0.6rem 0 1.2rem" }}>
        <button
          type="button"
          onClick={() => setQty((q) => Math.max(1, q - 1))}
          aria-label="Disminuir"
        >
          −
        </button>
        <span>{qty}</span>
        <button
          type="button"
          onClick={() => setQty((q) => q + 1)}
          aria-label="Aumentar"
        >
          +
        </button>
      </div>

      <div style={{ display: "flex", gap: "0.65rem", flexWrap: "wrap" }}>
        <button type="button" className="btn btn-primary" onClick={onAdd}>
          Agregar al carrito
        </button>
        <Link href="/carrito" className="btn btn-secondary">
          Ir al carrito
        </Link>
      </div>
      {msg && <div className="alert alert-success">{msg}</div>}
    </div>
  );
}
