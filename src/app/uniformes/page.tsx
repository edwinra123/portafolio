import { ProductCard } from "@/components/ProductCard";
import { products, searchProducts } from "@/lib/data";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Uniformes",
  description: "Catálogo completo de uniformes profesionales medixuniformes.",
};

export default async function UniformesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const list = q ? searchProducts(q) : products;

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
