"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { Product, Size } from "@/lib/types";
import { formatCOP } from "@/lib/format";
import { useCart } from "@/context/CartContext";

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  const quickAdd = () => {
    const size: Size = "M";
    addItem(product, size, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  };

  return (
    <article className="product-card">
      <Link href={`/producto/${product.slug}`} className="product-media">
        <Image
          src={product.imageUrl}
          alt={product.name}
          width={600}
          height={600}
          sizes="(max-width: 640px) 100vw, 33vw"
        />
      </Link>
      <div className="product-body">
        <h3>
          <Link href={`/producto/${product.slug}`}>{product.name}</Link>
        </h3>
        <div className="product-price">{formatCOP(product.price)}</div>
        <div className="product-meta">Tallas XS–XXL · Stock {product.stock}</div>
        <div className="product-actions">
          <Link href={`/producto/${product.slug}`} className="btn btn-secondary">
            Ver
          </Link>
          <button type="button" className="btn btn-primary" onClick={quickAdd}>
            {added ? "Agregado" : "Agregar"}
          </button>
        </div>
      </div>
    </article>
  );
}
