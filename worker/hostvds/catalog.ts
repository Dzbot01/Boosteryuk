/**
 * Public order catalog built from HostVDS (OpenStack) data:
 * flavors -> priced plans, Glance images -> grouped by distro, catalog regions.
 * Contains no credentials or customer data, so it is safe to serve without an API key.
 */

export interface NovaFlavor {
  id: string;
  name: string;
  vcpus: number;
  ram: number; // MiB
  disk: number; // GiB
  "OS-FLV-DISABLED:disabled"?: boolean;
  "os-flavor-access:is_public"?: boolean;
}

export interface GlanceImage {
  id: string;
  name: string;
  status: string;
  visibility?: string;
  os_distro?: string;
  os_version?: string;
  min_disk?: number;
  size?: number | null;
}

export interface PricingConfig {
  currency: string;
  /** Exact monthly price per flavor name; wins over the formula. */
  flavors: Record<string, number>;
  perVcpu: number;
  perGbRam: number;
  perGbDisk: number;
  minimum: number;
  markup: number;
}

export const DEFAULT_PRICING: PricingConfig = {
  currency: "EUR",
  flavors: {},
  perVcpu: 0.5,
  perGbRam: 1.0,
  perGbDisk: 0.02,
  minimum: 1.49,
  markup: 1,
};

export interface CatalogFlavor {
  id: string;
  name: string;
  vcpus: number;
  ramMb: number;
  diskGb: number;
  monthly: number;
  priceSource: "flavor" | "formula";
}

export interface CatalogImage {
  id: string;
  name: string;
  distro: string;
  version: string;
  kind: "os" | "app";
  minDiskGb: number;
  sizeBytes: number | null;
}

export interface VpsCatalog {
  source: "hostvds";
  currency: string;
  generatedAt: string;
  regions: string[];
  flavors: CatalogFlavor[];
  images: CatalogImage[];
}

const APP_DISTROS = new Set([
  "docker", "plesk", "cpanel", "wordpress", "nextcloud", "gitlab", "coolify", "n8n", "lamp", "lemp",
]);

export function parsePricing(raw: string | undefined): PricingConfig {
  if (!raw) return DEFAULT_PRICING;
  try {
    const p = JSON.parse(raw) as Partial<PricingConfig>;
    return { ...DEFAULT_PRICING, ...p, flavors: { ...DEFAULT_PRICING.flavors, ...(p.flavors ?? {}) } };
  } catch {
    console.error("VPS_PRICING is not valid JSON; using defaults");
    return DEFAULT_PRICING;
  }
}

export function priceFlavor(f: NovaFlavor, pricing: PricingConfig): Pick<CatalogFlavor, "monthly" | "priceSource"> {
  const fixed = pricing.flavors[f.name];
  if (typeof fixed === "number") return { monthly: fixed, priceSource: "flavor" };
  const base = f.vcpus * pricing.perVcpu + (f.ram / 1024) * pricing.perGbRam + f.disk * pricing.perGbDisk;
  const monthly = Math.max(pricing.minimum, base * pricing.markup);
  return { monthly: Math.round(monthly * 100) / 100, priceSource: "formula" };
}

export function mapFlavors(flavors: NovaFlavor[], pricing: PricingConfig): CatalogFlavor[] {
  return flavors
    .filter((f) => !f["OS-FLV-DISABLED:disabled"] && f["os-flavor-access:is_public"] !== false)
    .map((f) => ({ id: f.id, name: f.name, vcpus: f.vcpus, ramMb: f.ram, diskGb: f.disk, ...priceFlavor(f, pricing) }))
    .sort((a, b) => a.monthly - b.monthly || a.vcpus - b.vcpus || a.ramMb - b.ramMb);
}

export function mapImage(img: GlanceImage): CatalogImage {
  const name = img.name?.trim() || img.id;
  const firstWord = name.split(/[\s_-]+/)[0] ?? name;
  const distro = (img.os_distro || firstWord).toLowerCase();
  const fromName = name.slice(firstWord.length).replace(/^[\s_-]+/, "").trim();
  const version = (img.os_version || fromName || "latest").trim();
  return {
    id: img.id,
    name,
    distro,
    version,
    kind: APP_DISTROS.has(distro) ? "app" : "os",
    minDiskGb: img.min_disk ?? 0,
    sizeBytes: img.size ?? null,
  };
}

export function mapImages(images: GlanceImage[]): CatalogImage[] {
  return images.filter((i) => i.status === "active").map(mapImage);
}
