"use client";

import { ChatWidget } from "@/components/ChatWidget";
import { CartProvider } from "@/context/CartContext";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <CartProvider>
      {children}
      <ChatWidget />
    </CartProvider>
  );
}
