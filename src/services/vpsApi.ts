/**
 * vpsApi.ts
 *
 * Browser → Cloudflare Worker (/api/vps/catalog) → HostVDS OpenStack API
 * Kredensial OpenStack hanya ada di Worker (secret), endpoint ini publik & read-only.
 */

import { useEffect, useState } from 'react';
import {
  IMAGES,
  PLANS,
  REGIONS,
  type ImageSpec,
  type PlanFamily,
  type PlanSpec,
  type RegionSpec,
} from '../data/serverData';

/* --------------------------- respons worker --------------------------- */

export interface CatalogFlavor {
  id: string;
  name: string;
  vcpus: number;
  ramMb: number;
  diskGb: number;
  monthly: number;
  priceSource: 'flavor' | 'formula';
}

export interface CatalogImage {
  id: string;
  name: string;
  distro: string;
  version: string;
  kind: 'os' | 'app';
  minDiskGb: number;
  sizeBytes: number | null;
}

export interface VpsCatalog {
  source: 'hostvds';
  currency: string;
  generatedAt: string;
  regions: string[];
  flavors: CatalogFlavor[];
  images: CatalogImage[];
}

// Frontend dan Worker di-host terpisah (Vercel vs Cloudflare), jadi panggil Worker langsung.
// Bisa di-override lewat env VITE_VPS_API_URL (mis. domain custom Worker).
const VPS_API_BASE = (import.meta.env.VITE_VPS_API_URL || 'https://boosteryuk.boosteryukid.workers.dev').replace(/\/+$/, '');
const CATALOG_URL = `${VPS_API_BASE}/api/vps/catalog`;

export async function fetchVpsCatalog(signal?: AbortSignal): Promise<VpsCatalog> {
  const res = await fetch(CATALOG_URL, { signal, headers: { accept: 'application/json' } });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error || `Gagal memuat katalog VPS (${res.status})`);
  }
  return (await res.json()) as VpsCatalog;
}

/* ----------------------- mapping ke tipe UI lama ---------------------- */

/** Metadata tampilan per region OpenStack. Isi/ubah sesuai lokasi asli HostVDS. */
const REGION_META: Record<string, Omit<RegionSpec, 'id'>> = {};

function formatGib(mb: number): string {
  const gib = mb / 1024;
  return Number.isInteger(gib) ? `${gib}` : gib.toFixed(1);
}

function inferFamily(name: string): PlanFamily {
  if (/high.?freq|\bhf\b|-hf-|^hf/i.test(name)) return 'High Frequency';
  if (/highload|\bhl\b|-hl-|^hl|dedicated/i.test(name)) return 'Highload';
  return 'Burstable';
}

export function flavorToPlan(f: CatalogFlavor): PlanSpec {
  return {
    id: f.id,
    flavorId: f.id,
    family: inferFamily(f.name),
    name: f.name,
    cpu: `${f.vcpus} CPU`,
    ram: `${formatGib(f.ramMb)} GiB RAM`,
    storage: `${f.diskGb} GiB Disk`,
    bandwidth: '100 Mbit/s Bandwidth',
    traffic: 'Unlimited Traffic',
    monthly: f.monthly,
    priceSource: f.priceSource,
  };
}

export function regionToSpec(id: string): RegionSpec {
  const meta = REGION_META[id];
  if (meta) return { id, ...meta };
  return { id, country: 'HostVDS', flag: 'eu', city: id, code: id.toUpperCase() };
}

const VERSION_COLLATOR = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });

/** Kelompokkan image Glance per distro → satu ImageTile dengan daftar versi. */
export function groupImages(images: CatalogImage[]): ImageSpec[] {
  const groups = new Map<string, ImageSpec>();
  for (const img of images) {
    let spec = groups.get(img.distro);
    if (!spec) {
      const known = IMAGES.find((i) => i.id === img.distro || i.icon === img.distro);
      spec = {
        id: img.distro,
        kind: img.kind,
        name: known?.name ?? img.distro.charAt(0).toUpperCase() + img.distro.slice(1),
        icon: known?.icon ?? img.distro,
        color: known?.color ?? '#64748B',
        versions: [],
        imageIds: {},
      };
      groups.set(img.distro, spec);
    }
    // Nama versi bisa sama (mis. dua build), beri suffix agar tetap unik.
    let label = img.version;
    for (let n = 2; spec.imageIds![label]; n++) label = `${img.version} (${n})`;
    spec.versions.push(label);
    spec.imageIds![label] = img.id;
  }
  for (const spec of groups.values()) spec.versions.sort((a, b) => VERSION_COLLATOR.compare(b, a));
  return [...groups.values()].sort((a, b) => a.name.localeCompare(b.name));
}

/* ------------------------------- hook -------------------------------- */

export interface VpsCatalogState {
  status: 'loading' | 'live' | 'fallback';
  error: string | null;
  plans: PlanSpec[];
  images: ImageSpec[];
  regions: RegionSpec[];
  generatedAt: string | null;
  reload: () => void;
}

/**
 * Ambil katalog dari HostVDS. Jika gagal (worker belum dikonfigurasi, jaringan, dll.)
 * halaman tetap jalan memakai data statis serverData.ts dan status 'fallback'.
 */
export function useVpsCatalog(): VpsCatalogState {
  const [nonce, setNonce] = useState(0);
  const [state, setState] = useState<Omit<VpsCatalogState, 'reload'>>({
    status: 'loading',
    error: null,
    plans: [],
    images: [],
    regions: [],
    generatedAt: null,
  });

  useEffect(() => {
    const controller = new AbortController();
    setState((s) => ({ ...s, status: 'loading', error: null }));
    fetchVpsCatalog(controller.signal)
      .then((catalog) => {
        const plans = catalog.flavors.map(flavorToPlan);
        const images = groupImages(catalog.images);
        const regions = catalog.regions.map(regionToSpec);
        if (!plans.length) throw new Error('HostVDS tidak mengembalikan paket (flavor) apa pun');
        setState({
          status: 'live',
          error: null,
          plans,
          images: images.length ? images : IMAGES,
          regions: regions.length ? regions : REGIONS,
          generatedAt: catalog.generatedAt,
        });
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setState({
          status: 'fallback',
          error: err instanceof Error ? err.message : String(err),
          plans: PLANS,
          images: IMAGES,
          regions: REGIONS,
          generatedAt: null,
        });
      });
    return () => controller.abort();
  }, [nonce]);

  return { ...state, reload: () => setNonce((n) => n + 1) };
}
