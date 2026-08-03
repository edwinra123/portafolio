"use client";

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { ProductCard } from "@/components/ProductCard";
import { products, searchProducts } from "@/lib/data";

function UniformesContent() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") || "";
  const list = useMemo(() => (q ? searchProducts(q) : products), [q]);

  return (
    <section className="section">
      <div className="container">
        <div className="section-head">
          <div>
            <h2>Uniformes</h2>
            <p>
              {q
                ? `Resultados para “${q}” (${list.length})`
                : `${list.length} modelos disponibles · $55.000 COP`}
            </p>
          </div>
        </div>
        {list.length === 0 ? (
          <div className="empty-state panel">
            <h2>Sin resultados</h2>
            <p>Prueba con otro término de búsqueda.</p>
          </div>
        ) : (
          <div className="product-grid">
            {list.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default function UniformesPage() {
  return (
    <Suspense
      fallback={
        <section className="section">
          <div className="container">
            <div className="panel">Cargando uniformes...</div>
          </div>
        </section>
      }
    >
      <UniformesContent />
    </Suspense>
  );
}
