# medixuniformes

Tienda online de uniformes profesionales basada en el catálogo Medix (Treinta), con:

- Catálogo de productos y carrito
- Checkout con **pago con tarjeta** (pasarela demo) y **contraentrega**
- Panel de administrador para verificar pedidos pagados y gestionar contraentregas

## Desarrollo

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

Panel admin: [http://localhost:3000/admin](http://localhost:3000/admin)

Contraseña por defecto: `medixadmin2026`  
Configura `ADMIN_PASSWORD` y `ADMIN_SESSION_SECRET` con el archivo `.env.example`.

## Pagos

### Tarjeta (pasarela demo)

Valida número (Luhn), vencimiento y CVC. Guarda solo marca, últimos 4 dígitos y código de autorización.

- Ejemplo OK: `4242 4242 4242 4242`
- Ejemplo rechazo: cualquier tarjeta válida que termine en `0000`

En producción puedes conectar Wompi, Mercado Pago o PayU reemplazando `src/lib/payment.ts` y el endpoint `/api/checkout`.

### Contraentrega

Crea el pedido en estado `cod_pending`. El admin puede confirmar el pago al entregar.

## Admin

Desde el panel puedes:

- Ver pedidos pagados con tarjeta
- Filtrar por contraentrega / enviados / entregados
- Marcar enviado, confirmar COD, entregar o cancelar

Los pedidos se guardan en `data/orders.json` (se crea automáticamente).

## Deploy

Compatible con Vercel u otro host Node:

```bash
npm run build
npm start
```

> En entornos serverless, considera mover el almacenamiento de pedidos a una base de datos (Postgres/Supabase) porque el filesystem puede ser efímero.
