import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import {
  IconCash,
  IconCheck,
  IconDental,
  IconHospital,
  IconLock,
  IconNurse,
  IconOther,
  IconPhysio,
  IconStethoscope,
  IconTherapy,
  IconTruck,
} from "@/components/Icons";
import { products, store } from "@/lib/data";

const categories = [
  { label: "Doctores", icon: <IconStethoscope /> },
  { label: "Enfermeras", icon: <IconNurse /> },
  { label: "Fisioterapeutas", icon: <IconPhysio /> },
  { label: "Terapeutas", icon: <IconTherapy /> },
  { label: "Odontólogos", icon: <IconDental /> },
  { label: "Personal Sanitario", icon: <IconHospital /> },
  { label: "Otros", icon: <IconOther /> },
];

export default function HomePage() {
  const featured = products.slice(0, 6);

  return (
    <>
      <section className="hero">
        <div className="container">
          <div className="hero-panel">
            <div className="hero-copy">
              <div className="hero-brand">medixuniformes</div>
              <h1>Uniformes Profesionales</h1>
              <p>{store.tagline}</p>
              <div className="hero-actions">
                <Link href="/uniformes" className="btn btn-primary">
                  Ver Colección →
                </Link>
                <Link href="/contacto" className="btn btn-secondary">
                  Hablar por WhatsApp
                </Link>
              </div>
            </div>
            <div className="hero-visual" aria-hidden="true" />
          </div>

          <div className="category-row">
            {categories.map((c) => (
              <Link key={c.label} href="/uniformes" className="category-item">
                <span className="category-icon">{c.icon}</span>
                {c.label}
              </Link>
            ))}
          </div>

          <div className="trust-bar">
            <div className="trust-item">
              <div className="trust-icon">
                <IconTruck />
              </div>
              <div>
                <strong>Envíos rápidos</strong>
                <span>A toda Colombia desde {store.city}</span>
              </div>
            </div>
            <div className="trust-item">
              <div className="trust-icon">
                <IconLock />
              </div>
              <div>
                <strong>Pago seguro</strong>
                <span>Tarjeta con verificación en panel admin</span>
              </div>
            </div>
            <div className="trust-item">
              <div className="trust-icon">
                <IconCash />
              </div>
              <div>
                <strong>Contraentrega</strong>
                <span>Paga al recibir tu pedido</span>
              </div>
            </div>
            <div className="trust-item">
              <div className="trust-icon">
                <IconCheck />
              </div>
              <div>
                <strong>Calidad garantizada</strong>
                <span>Telas cómodas y duraderas</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="coleccion">
        <div className="container">
          <div className="section-head">
            <div>
              <h2>Nuestros Uniformes</h2>
              <p>
                Catálogo Medix con colores y cortes para tu jornada clínica.
              </p>
            </div>
            <Link href="/uniformes" className="btn btn-secondary">
              Ver todos
            </Link>
          </div>
          <div className="product-grid">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="features">
            <h2>Calidad, confort y durabilidad</h2>
            <p>Uniformes diseñados para acompañarte en cada jornada laboral.</p>
            <div className="feature-grid">
              <div className="feature-item">
                <strong>Tejidos transpirables</strong>
                <span>Frescura en turnos largos.</span>
              </div>
              <div className="feature-item">
                <strong>Libertad de movimiento</strong>
                <span>Cortes pensados para el trabajo clínico.</span>
              </div>
              <div className="feature-item">
                <strong>Resistentes y duraderos</strong>
                <span>Listos para uso diario intensivo.</span>
              </div>
              <div className="feature-item">
                <strong>Fáciles de lavar</strong>
                <span>Mantiene color y forma lavado tras lavado.</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
