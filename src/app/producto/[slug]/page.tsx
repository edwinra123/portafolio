import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductBySlug, products } from "@/lib/data";
import { formatCOP } from "@/lib/format";
import { AddToCartPanel } from "@/components/AddToCartPanel";
import type { Metadata } from "next";

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) return { title: "Producto" };
  return {
    title: product.name,
    description: product.description,
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) notFound();

  return (
    <section className="container detail">
      <div className="detail-media">
        <Image
          src={product.imageUrl}
          alt={product.name}
          width={900}
          height={900}
          priority
        />
      </div>
      <div className="detail-info">
        <p className="product-meta">
          <Link href="/uniformes">Uniformes</Link> / {product.name}
        </p>
        <h1>{product.name}</h1>
        <div className="price">{formatCOP(product.price)}</div>
        <p>{product.description}</p>
        <p className="product-meta">Disponibles: {product.stock} unidades</p>
        <AddToCartPanel product={product} />
      </div>
    </section>
  );
}
