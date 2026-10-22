/** Subset of the Nova server object (microversion 2.47+) that we read. */
export interface NovaServer {
  id: string;
  name: string;
  status: string;
  created: string;
  updated: string;
  key_name?: string | null;
  metadata?: Record<string, string>;
  image?: { id: string } | "";
  flavor?: {
    id?: string; // < 2.47
    original_name?: string; // >= 2.47
    vcpus?: number;
    ram?: number;
    disk?: number;
  };
  addresses?: Record<string, Array<{ addr: string; version: 4 | 6; "OS-EXT-IPS:type"?: string }>>;
  "OS-EXT-STS:power_state"?: number;
  "OS-EXT-STS:task_state"?: string | null;
  "OS-EXT-STS:vm_state"?: string;
  "OS-EXT-AZ:availability_zone"?: string;
  "OS-SRV-USG:launched_at"?: string | null;
}

// https://docs.openstack.org/api-ref/compute/#show-server-details (OS-EXT-STS:power_state)
const POWER_STATES: Record<number, string> = {
  0: "NOSTATE",
  1: "RUNNING",
  3: "PAUSED",
  4: "SHUTDOWN",
  6: "CRASHED",
  7: "SUSPENDED",
};

export interface VpsSummary {
  id: string;
  name: string;
  status: string;
  powerState: string;
  vmState: string | null;
  taskState: string | null;
  ipv4: string[];
  ipv6: string[];
  networks: string[];
  flavor: { name: string | null; vcpus: number | null; ramMb: number | null; diskGb: number | null };
  imageId: string | null;
  keyName: string | null;
  availabilityZone: string | null;
  createdAt: string;
  updatedAt: string;
  launchedAt: string | null;
  metadata: Record<string, string>;
}

export function mapServer(s: NovaServer): VpsSummary {
  const ipv4: string[] = [];
  const ipv6: string[] = [];
  for (const addrs of Object.values(s.addresses ?? {})) {
    for (const a of addrs) (a.version === 6 ? ipv6 : ipv4).push(a.addr);
  }
  const ps = s["OS-EXT-STS:power_state"];
  return {
    id: s.id,
    name: s.name,
    status: s.status,
    powerState: ps === undefined ? "UNKNOWN" : POWER_STATES[ps] ?? String(ps),
    vmState: s["OS-EXT-STS:vm_state"] ?? null,
    taskState: s["OS-EXT-STS:task_state"] ?? null,
    ipv4,
    ipv6,
    networks: Object.keys(s.addresses ?? {}),
    flavor: {
      name: s.flavor?.original_name ?? s.flavor?.id ?? null,
      vcpus: s.flavor?.vcpus ?? null,
      ramMb: s.flavor?.ram ?? null,
      diskGb: s.flavor?.disk ?? null,
    },
    imageId: s.image && typeof s.image === "object" ? s.image.id : null,
    keyName: s.key_name ?? null,
    availabilityZone: s["OS-EXT-AZ:availability_zone"] ?? null,
    createdAt: s.created,
    updatedAt: s.updated,
    launchedAt: s["OS-SRV-USG:launched_at"] ?? null,
    metadata: s.metadata ?? {},
  };
}
