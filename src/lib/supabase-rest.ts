const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
const SUPABASE_KEY = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export type Business = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  category: string;
  is_open: boolean | null;
  phone: string | null;
  address: string | null;
};

export class SupabaseRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SupabaseRequestError';
  }
}

export function isSupabaseConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_KEY);
}

export async function fetchBusinesses(options: {
  search?: string;
  category?: string;
  offset?: number;
  limit?: number;
  signal?: AbortSignal;
} = {}): Promise<Business[]> {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new SupabaseRequestError(
      'Supabase is not configured. Add the EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY values to your .env file.'
    );
  }

  const limit = Math.min(Math.max(options.limit ?? 20, 1), 30);
  const offset = Math.max(options.offset ?? 0, 0);
  const params = new URLSearchParams({
    select: 'id,name,slug,description,logo_url,cover_image_url,category,is_open,phone,address',
    status: 'eq.approved',
    order: 'name.asc',
    limit: String(limit),
    offset: String(offset),
  });

  const search = options.search?.trim().replace(/[,%()]/g, ' ').replace(/\s+/g, ' ');
  if (search) {
    const safeSearch = search.slice(0, 80);
    params.set('or', '(name.ilike.*' + safeSearch + '*,description.ilike.*' + safeSearch + '*,category.ilike.*' + safeSearch + '*)');
  }

  const category = options.category?.trim();
  if (category && category !== 'All') {
    const categorySearch: Record<string, string> = {
      Fashion: 'fashion',
      Beauty: 'beauty',
      'Food & drinks': 'restaurant',
      Electronics: 'electronics',
      Services: 'service',
    };
    const categoryValue = categorySearch[category] ?? category.toLowerCase();
    params.set('category', 'ilike.*' + categoryValue.replace(/[,%()]/g, '') + '*');
  }

  const response = await fetch(SUPABASE_URL + '/rest/v1/businesses?' + params.toString(), {
    method: 'GET',
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: 'Bearer ' + SUPABASE_KEY,
      Accept: 'application/json',
    },
    signal: options.signal,
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new SupabaseRequestError('Supabase rejected the public request. Check the publishable key and public read policies.');
    }
    throw new SupabaseRequestError('Could not load campus businesses (HTTP ' + response.status + '). Please try again.');
  }

  const data: unknown = await response.json();
  if (!Array.isArray(data)) {
    throw new SupabaseRequestError('The business list response was unexpected.');
  }

  return data as Business[];
}


export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean | null;
  business: { name: string; status: string } | { name: string; status: string }[] | null;
};

export async function fetchProducts(options: {
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  limit?: number;
  signal?: AbortSignal;
} = {}): Promise<Product[]> {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new SupabaseRequestError(
      'Supabase is not configured. Add the EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY values to your .env file.'
    );
  }

  const limit = Math.min(Math.max(options.limit ?? 24, 1), 30);
  const params = new URLSearchParams({
    select: 'id,name,slug,description,price,image_url,is_available,business:businesses!inner(name,status)',
    'business.status': 'eq.approved',
    is_available: 'eq.true',
    order: 'created_at.desc',
    limit: String(limit),
  });

  const search = options.search?.trim().replace(/[,%()]/g, ' ').replace(/\s+/g, ' ');
  if (search) {
    const safeSearch = search.slice(0, 80);
    params.set('or', '(name.ilike.*' + safeSearch + '*,description.ilike.*' + safeSearch + '*)');
  }
  if (Number.isFinite(options.minPrice) && options.minPrice !== undefined && options.minPrice >= 0) {
    params.set('price', 'gte.' + String(options.minPrice));
  }
  if (Number.isFinite(options.maxPrice) && options.maxPrice !== undefined && options.maxPrice >= 0) {
    params.append('price', 'lte.' + String(options.maxPrice));
  }

  const response = await fetch(SUPABASE_URL + '/rest/v1/products?' + params.toString(), {
    method: 'GET',
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: 'Bearer ' + SUPABASE_KEY,
      Accept: 'application/json',
    },
    signal: options.signal,
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new SupabaseRequestError('Supabase rejected the public product request. Check the publishable key and product read policies.');
    }
    throw new SupabaseRequestError('Could not load products (HTTP ' + response.status + '). Please try again.');
  }

  const data: unknown = await response.json();
  if (!Array.isArray(data)) {
    throw new SupabaseRequestError('The product list response was unexpected.');
  }
  return data as Product[];
}
