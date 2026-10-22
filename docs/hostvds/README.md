# HostVDS VPS API (Cloudflare Worker)

Dokumen: [PRD](PRD.md) · [ERD](ERD.md) · [ARD](ARD.md) · [Audit](AUDIT.md) · [Worklog](WORKLOG.md)

## Jalankan lokal
```bash
npm install
cp .dev.vars.example .dev.vars     # isi OS_PASSWORD & VPS_API_KEY
npm run build                      # build SPA ke dist/
npx wrangler dev                   # http://localhost:8787  → buka /ordervps
npm test                           # 16 unit test
```

## Deploy
```bash
npx wrangler secret put OS_PASSWORD
npx wrangler secret put VPS_API_KEY     # mis. openssl rand -hex 32
npm run deploy
curl -H "Authorization: Bearer $VPS_API_KEY" https://<worker>/api/vps/endpoints   # cek endpoint HostVDS
curl https://<worker>/api/vps/catalog
curl -H "Authorization: Bearer $VPS_API_KEY" https://<worker>/api/vps/servers
```

## Kode
- `worker/hostvds/openstack.ts` — Keystone v3, service catalog, cache token, retry 401, timeout
- `worker/hostvds/catalog.ts` — flavor → harga, image Glance → distro/versi
- `worker/hostvds/routes.ts` — rute `/api/vps/*`
- `src/services/vpsApi.ts` — fetch + mapping ke tipe UI + hook `useVpsCatalog`
- `src/pages/OrderVpsPage.tsx` — memakai data live
