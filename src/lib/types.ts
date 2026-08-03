export type Size = "XS" | "S" | "M" | "L" | "XL" | "XXL";

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  stock: number;
  slug: string;
  sizes: Size[];
};

export type CartItem = {
  productId: string;
  name: string;
  price: number;
  imageUrl: string;
  size: Size;
  quantity: number;
};

export type PaymentMethod = "card" | "cod";

export type OrderStatus =
  | "pending_payment"
  | "paid"
  | "cod_pending"
  | "cod_confirmed"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "failed";

export type CustomerInfo = {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  notes?: string;
};

export type CardPaymentMeta = {
  brand: string;
  last4: string;
  holderName: string;
  authCode: string;
  processedAt: string;
};

export type Order = {
  id: string;
  createdAt: string;
  updatedAt: string;
  items: CartItem[];
  customer: CustomerInfo;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  subtotal: number;
  shipping: number;
  total: number;
  card?: CardPaymentMeta;
  adminNotes?: string;
};

export type StoreInfo = {
  name: string;
  displayName: string;
  tagline: string;
  phone: string;
  city: string;
  country: string;
  logo: string;
  whatsapp: string;
  currency: string;
  shippingThreshold: number;
  shippingCost: number;
};
