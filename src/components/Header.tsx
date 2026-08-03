"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { BrandMark } from "./BrandMark";
import { useCart } from "@/context/CartContext";

const links = [
  { href: "/", label: "Inicio" },
  { href: "/uniformes", label: "Uniformes" },
  { href: "/nosotros", label: "Quiénes Somos" },
  { href: "/contacto", label: "Contacto" },
];

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { count } = useCart();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  if (pathname?.startsWith("/admin")) return null;

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    const query = q.trim();
    router.push(query ? `/uniformes?q=${encodeURIComponent(query)}` : "/uniformes");
    setOpen(false);
  };

  return (
    <>
      <div className="topbar">
        <div className="container topbar-inner">
          <span>Envíos gratis desde $150.000</span>
          <span>Calidad y comodidad para tu día a día</span>
          <span>Atención | L-D 7:00 - 21:00</span>
        </div>
      </div>
      <header className="header">
        <div className="container">
          <div className="header-inner">
            <Link href="/" className="brand" onClick={() => setOpen(false)}>
              <BrandMark />
              <span className="brand-text">
                <strong>medixuniformes</strong>
                <small>Uniformes profesionales</small>
              </span>
            </Link>

            <nav className="nav" aria-label="Principal">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  aria-current={pathname === l.href ? "page" : undefined}
                >
                  {l.label}
                </Link>
              ))}
            </nav>

            <div className="header-actions">
              <form className="search-form" onSubmit={onSearch}>
                <input
                  type="search"
                  placeholder="Buscar productos..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  aria-label="Buscar productos"
                />
              </form>
              <button
                type="button"
                className="icon-btn menu-toggle"
                aria-label="Abrir menú"
                onClick={() => setOpen((v) => !v)}
              >
                ☰
              </button>
              <Link href="/carrito" className="icon-btn" aria-label="Carrito">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M3 5h2l2.2 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H7"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="10" cy="20" r="1.4" fill="currentColor" />
                  <circle cx="17" cy="20" r="1.4" fill="currentColor" />
                </svg>
                {count > 0 && <span className="badge">{count}</span>}
              </Link>
            </div>
          </div>

          <div className="mobile-nav" data-open={open}>
            {links.map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)}>
                {l.label}
              </Link>
            ))}
            <form onSubmit={onSearch}>
              <input
                type="search"
                placeholder="Buscar productos..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                aria-label="Buscar productos"
              />
            </form>
          </div>
        </div>
      </header>
    </>
  );
}
