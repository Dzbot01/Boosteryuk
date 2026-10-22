/**
 * Minimal OpenStack client for Cloudflare Workers (HostVDS = OpenStack + Keystone v3).
 *
 * Flow: Keystone password auth -> X-Subject-Token + service catalog
 *       -> pick endpoint per service type (region + interface) -> call Nova / Neutron / Glance.
 */

export interface OpenStackConfig {
  authUrl: string; // e.g. https://os-api.hostvds.com/identity
  username: string;
  password: string;
  projectName: string;
  userDomainName: string;
  projectDomainId: string;
  region?: string;
  interface: string; // public | internal | admin
}

interface CatalogEndpoint {
  interface: string;
  region?: string | null;
  region_id?: string | null;
  url: string;
}

interface CatalogEntry {
  type: string;
  name?: string;
  endpoints: CatalogEndpoint[];
}

export interface Session {
  token: string;
  expiresAt: number; // epoch ms
  projectId?: string;
  catalog: CatalogEntry[];
}

export class OpenStackError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly upstream?: string,
  ) {
    super(message);
  }
}

// Refresh this long before Keystone says the token expires.
const TOKEN_SKEW_MS = 5 * 60 * 1000;

const REQUEST_TIMEOUT_MS = 15_000;

// Default version suffix to append when the catalog URL is unversioned.
const VERSION_SUFFIX: Record<string, string> = {
  network: "v2.0",
  image: "v2",
};

// Nova 2.47+ embeds flavor details (vcpus/ram/disk) inside each server.
const COMPUTE_MICROVERSION = "compute 2.47";

export class OpenStackClient {
  private session: Session | null = null;
  private pending: Promise<Session> | null = null;

  private readonly fetchImpl: typeof fetch;

  constructor(
    private readonly cfg: OpenStackConfig,
    fetchImpl: typeof fetch = (...a) => fetch(...a),
  ) {
    // Network failures (DNS, TLS, timeouts) become a clean 502 instead of an opaque 500.
    this.fetchImpl = async (input, init) => {
      try {
        return await fetchImpl(input, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS), ...init });
      } catch (err) {
        throw new OpenStackError(`Upstream unreachable: ${new URL(String(input)).host}`, 502, String(err));
      }
    };
  }

  /** Returns a valid session, authenticating at most once concurrently. */
  async getSession(force = false): Promise<Session> {
    if (!force && this.session && Date.now() < this.session.expiresAt - TOKEN_SKEW_MS) {
      return this.session;
    }
    this.pending ??= this.authenticate().finally(() => {
      this.pending = null;
    });
    this.session = await this.pending;
    return this.session;
  }

  private async authenticate(): Promise<Session> {
    const body = {
      auth: {
        identity: {
          methods: ["password"],
          password: {
            user: {
              name: this.cfg.username,
              domain: { name: this.cfg.userDomainName },
              password: this.cfg.password,
            },
          },
        },
        scope: {
          project: {
            name: this.cfg.projectName,
            domain: { id: this.cfg.projectDomainId },
          },
        },
      },
    };

    const res = await this.fetchImpl(`${trimSlash(this.cfg.authUrl)}/v3/auth/tokens`, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      // Never echo the request body (it contains the password).
      throw new OpenStackError(`Keystone auth failed (${res.status})`, 502, await safeText(res));
    }

    const token = res.headers.get("x-subject-token");
    if (!token) throw new OpenStackError("Keystone response missing X-Subject-Token", 502);

    const data = (await res.json()) as {
      token: { expires_at: string; project?: { id: string }; catalog?: CatalogEntry[] };
    };

    return {
      token,
      expiresAt: Date.parse(data.token.expires_at),
      projectId: data.token.project?.id,
      catalog: data.token.catalog ?? [],
    };
  }

  /** Resolve the base URL of a service type (compute, network, image, ...). */
  endpointFor(session: Session, serviceType: string): string {
    const entry = session.catalog.find((c) => c.type === serviceType);
    if (!entry) throw new OpenStackError(`Service '${serviceType}' not in catalog`, 502);

    const region = this.cfg.region;
    const ep =
      entry.endpoints.find(
        (e) =>
          e.interface === this.cfg.interface &&
          (!region || e.region_id === region || e.region === region),
      ) ?? entry.endpoints.find((e) => e.interface === this.cfg.interface);

    if (!ep) {
      throw new OpenStackError(
        `No '${this.cfg.interface}' endpoint for '${serviceType}' in region '${region ?? "*"}'`,
        502,
      );
    }

    let url = trimSlash(ep.url);
    const suffix = VERSION_SUFFIX[serviceType];
    if (suffix && !/\/v\d+(\.\d+)?$/.test(url)) url = `${url}/${suffix}`;
    return url;
  }

  /** GET a JSON resource from a catalog service; retries once on 401 with a fresh token. */
  async get<T>(serviceType: string, path: string, retried = false): Promise<T> {
    const session = await this.getSession(retried);
    const url = `${this.endpointFor(session, serviceType)}${path}`;

    const headers: Record<string, string> = {
      "x-auth-token": session.token,
      accept: "application/json",
    };
    if (serviceType === "compute") headers["openstack-api-version"] = COMPUTE_MICROVERSION;

    const res = await this.fetchImpl(url, { headers });

    if (res.status === 401 && !retried) return this.get<T>(serviceType, path, true);
    if (!res.ok) {
      throw new OpenStackError(
        `${serviceType} ${path} failed (${res.status})`,
        res.status === 404 ? 404 : 502,
        await safeText(res),
      );
    }
    return (await res.json()) as T;
  }

  /** Lists the services the token can reach (useful for discovery/debugging). */
  async catalogSummary() {
    const s = await this.getSession();
    return {
      projectId: s.projectId,
      tokenExpiresAt: new Date(s.expiresAt).toISOString(),
      services: s.catalog.map((c) => ({
        type: c.type,
        name: c.name,
        endpoints: c.endpoints.map((e) => ({
          interface: e.interface,
          region: e.region_id ?? e.region ?? null,
          url: e.url,
        })),
      })),
    };
  }
}

function trimSlash(u: string): string {
  return u.replace(/\/+$/, "");
}

async function safeText(res: Response): Promise<string> {
  try {
    return (await res.text()).slice(0, 500);
  } catch {
    return "";
  }
}
