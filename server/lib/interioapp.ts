/**
 * InterioApp API Client
 *
 * Connects to the InterioApp quoting platform via its Supabase Edge Function endpoints.
 * Authentication: account_id + storefront_api_key (stored in merchant settings).
 */

const INTERIOAPP_BASE_URL =
  process.env.INTERIOAPP_BASE_URL ||
  "https://ldgrcodffsalkevafbkb.supabase.co/functions/v1";

export interface InterioAppCredentials {
  account_id: string;
  api_key: string;
}

// ─── Response types ───────────────────────────────────────────

export interface InterioFabric {
  id: string;
  name: string;
  category: string;
  colours: string[];
  roll_width: number;
  price_per_sqm: number;
  price_per_linear_metre: number;
  surcharge: number;
  image_url?: string;
}

export interface InterioTemplate {
  id: string;
  code: string;
  name: string;
  category: string;
  pricing_model: string;
  min_width: number;
  max_width: number;
  min_drop: number;
  max_drop: number;
  options: Record<string, unknown>[];
  dimension_fields?: Record<string, unknown>;
  labels?: Record<string, unknown>;
}

export interface InterioInventoryOption {
  id: string;
  name: string;
  type: string;
  values: string[];
}

export interface InterioEstimateRequest {
  template_id: string;
  width: number;
  drop: number;
  fabric_id?: string;
  options?: Record<string, string>;
  quantity?: number;
}

export interface InterioEstimateResponse {
  total: number;
  breakdown: {
    base: number;
    fabric_surcharge: number;
    options_total: number;
    wastage: number;
    labour: number;
    installation: number;
  };
  currency: string;
}

export interface InterioLeadRequest {
  name: string;
  email: string;
  phone?: string;
  source?: string;
  notes?: string;
}

export interface InterioLeadResponse {
  id: string;
  client_id: string;
  status: string;
}

export interface InterioProjectItem {
  template_id: string;
  width: number;
  drop: number;
  fabric_id?: string;
  colour?: string;
  options?: Record<string, string>;
  quantity: number;
  room?: string;
  notes?: string;
}

export interface InterioProjectRequest {
  customer: {
    name: string;
    email: string;
    phone?: string;
    address?: string;
  };
  items: InterioProjectItem[];
  notes?: string;
  source?: string;
}

export interface InterioProjectResponse {
  id: string;
  project_number: string;
  status: string;
  items_count: number;
}

// ─── API Client ───────────────────────────────────────────────

class InterioAppError extends Error {
  constructor(
    public status: number,
    message: string,
    public endpoint: string,
  ) {
    super(`InterioApp ${endpoint}: ${message}`);
    this.name = "InterioAppError";
  }
}

async function interioFetch<T>(
  endpoint: string,
  credentials: InterioAppCredentials,
  options: {
    method?: string;
    body?: unknown;
    params?: Record<string, string>;
  } = {},
): Promise<T> {
  const { method = "GET", body, params = {} } = options;
  const url = new URL(`${INTERIOAPP_BASE_URL}/${endpoint}`);

  // Auth params always included
  url.searchParams.set("account_id", credentials.account_id);
  url.searchParams.set("api_key", credentials.api_key);

  // Extra query params
  for (const [key, val] of Object.entries(params)) {
    if (val) url.searchParams.set(key, val);
  }

  const fetchOptions: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  };

  if (body && method !== "GET") {
    fetchOptions.body = JSON.stringify(body);
  }

  const res = await fetch(url.toString(), fetchOptions);

  if (!res.ok) {
    const text = await res.text().catch(() => "Unknown error");
    throw new InterioAppError(res.status, text, endpoint);
  }

  return res.json() as Promise<T>;
}

// ─── Public API methods ───────────────────────────────────────

/**
 * GET /storefront-catalog — Browse fabric/product catalog
 */
export async function getCatalog(
  credentials: InterioAppCredentials,
  params?: {
    page?: number;
    per_page?: number;
    category?: string;
    search?: string;
  },
): Promise<{ fabrics: InterioFabric[]; total: number; page: number; per_page: number }> {
  const queryParams: Record<string, string> = {};
  if (params?.page) queryParams.page = String(params.page);
  if (params?.per_page) queryParams.per_page = String(params.per_page);
  if (params?.category) queryParams.category = params.category;
  if (params?.search) queryParams.search = params.search;

  return interioFetch("storefront-catalog", credentials, { params: queryParams });
}

/**
 * GET /storefront-options — Get treatment templates, options, inventory
 */
export async function getOptions(
  credentials: InterioAppCredentials,
  params?: {
    template_id?: string;
    category?: string;
  },
): Promise<{
  templates: InterioTemplate[];
  headings: InterioInventoryOption[];
  linings: InterioInventoryOption[];
  inventory_options: InterioInventoryOption[];
}> {
  const queryParams: Record<string, string> = {};
  if (params?.template_id) queryParams.template_id = params.template_id;
  if (params?.category) queryParams.category = params.category;

  return interioFetch("storefront-options", credentials, { params: queryParams });
}

/**
 * POST /storefront-estimate — Calculate price estimate
 */
export async function getEstimate(
  credentials: InterioAppCredentials,
  data: InterioEstimateRequest,
): Promise<InterioEstimateResponse> {
  return interioFetch("storefront-estimate", credentials, {
    method: "POST",
    body: data,
  });
}

/**
 * POST /storefront-lead — Create/match a lead from storefront inquiry
 */
export async function createLead(
  credentials: InterioAppCredentials,
  data: InterioLeadRequest,
): Promise<InterioLeadResponse> {
  return interioFetch("storefront-lead", credentials, {
    method: "POST",
    body: data,
  });
}

/**
 * POST /storefront-project — Submit a full project (customer + items)
 */
export async function createProject(
  credentials: InterioAppCredentials,
  data: InterioProjectRequest,
): Promise<InterioProjectResponse> {
  return interioFetch("storefront-project", credentials, {
    method: "POST",
    body: data,
  });
}

/**
 * Test the connection with given credentials
 */
export async function testConnection(
  credentials: InterioAppCredentials,
): Promise<{ success: boolean; error?: string; templates_count?: number; fabrics_count?: number }> {
  try {
    // Try fetching catalog and options in parallel as a connection test
    const [catalog, options] = await Promise.all([
      getCatalog(credentials, { per_page: 1 }),
      getOptions(credentials),
    ]);

    return {
      success: true,
      templates_count: options.templates?.length ?? 0,
      fabrics_count: catalog.total ?? 0,
    };
  } catch (err) {
    const message =
      err instanceof InterioAppError
        ? err.status === 401 || err.status === 403
          ? "Invalid API key or account ID"
          : `API error (${err.status}): ${err.message}`
        : err instanceof Error
          ? err.message
          : "Unknown error";

    return { success: false, error: message };
  }
}
