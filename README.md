# medixuniformes

Tienda online de uniformes profesionales publicada en GitHub Pages:

**https://edwinra123.github.io/portafolio/**

Incluye catálogo, carrito, pago con tarjeta (demo), contraentrega y panel admin.

## Desarrollo local

```bash
npm install
npm run dev
```

- Tienda: http://localhost:3000
- Admin: http://localhost:3000/admin
- Contraseña admin: `medixadmin2026`
- Tarjeta OK: `4242 4242 4242 4242`
- Tarjeta rechazo: `4000 0000 0002 0000`

## Publicar en GitHub Pages

```bash
npm run export:pages
git add -A
git commit -m "Update GitHub Pages site"
git push origin main
```

`export:pages` genera el sitio estático con `basePath=/portafolio` y lo copia a la raíz del repo (incluye `.nojekyll`).

## Notas

- En GitHub Pages los pedidos se guardan en el navegador (`localStorage`) para que el checkout y el admin funcionen sin servidor.
- Para producción con base de datos y pasarela real (Wompi / Mercado Pago), despliega en Vercel u otro host Node.
