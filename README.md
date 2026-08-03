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
- Ejemplo rechazo: `4000 0000 0002 0000`

En producción puedes conectar Wompi, Mercado Pago o PayU reemplazando `src/lib/payment.ts` y el endpoint `/api/checkout`.

### Contraentrega

Crea el pedido en estado `cod_pending`. El admin puede confirmar el pago al entregar.

## Admin

Desde el panel puedes:

- Ver pedidos pagados con tarjeta
- Filtrar por contraentrega / enviados / entregados
- Marcar enviado, confirmar COD, entregar o cancelar

Los pedidos se guardan en `data/orders.json` (se crea automáticamente).

## Chatbot de WhatsApp

La tienda incluye un bot por **WhatsApp Cloud API** (Meta) que reutiliza el mismo asistente del chat web: catálogo, tallas, envíos, pagos, horario y pase a asesor humano.

### 1. Variables de entorno

Copia `.env.example` y completa:

```bash
NEXT_PUBLIC_SITE_URL=https://tu-dominio.com
WHATSAPP_TOKEN=EAAB...
WHATSAPP_PHONE_NUMBER_ID=1234567890
WHATSAPP_VERIFY_TOKEN=medix-verify-token
WHATSAPP_APP_SECRET=opcional_pero_recomendado
```

### 2. Webhook en Meta

1. En [developers.facebook.com](https://developers.facebook.com/) crea una app y agrega **WhatsApp**.
2. En la configuración del webhook usa:
   - Callback URL: `https://tu-dominio.com/api/whatsapp/webhook`
   - Verify token: el mismo de `WHATSAPP_VERIFY_TOKEN`
3. Suscribe el campo `messages`.
4. Envía un mensaje de prueba al número de WhatsApp Business.

### 3. Probar sin Meta (local)

```bash
curl -X POST http://localhost:3000/api/whatsapp/simulate \
  -H 'Content-Type: application/json' \
  -d '{"message":"uniforme azul"}'
```

Estado de configuración:

```bash
curl http://localhost:3000/api/whatsapp/status
```

Si el token no está configurado, el webhook igual responde `200` y deja la respuesta en logs (`[whatsapp:dry-run]`).

### Comandos útiles del bot

- `hola` / `ayuda`
- `productos` / `uniforme azul`
- `tallas` · `envíos` · `formas de pago` · `horario`
- `asesor` (pide atención humana)

## Deploy

Compatible con Vercel u otro host Node:

```bash
npm run build
npm start
```

> En entornos serverless, considera mover el almacenamiento de pedidos a una base de datos (Postgres/Supabase) porque el filesystem puede ser efímero.
>
> El webhook de WhatsApp necesita una URL HTTPS pública (Vercel + Meta).
