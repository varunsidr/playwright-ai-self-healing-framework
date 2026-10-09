const publicHostname = 'zeouf-luxury-fashion-ecommerce.vercel.app';

/** Operator confirmation means the URL has a separate Supabase project and disposable data. */
export function isConfirmedEcommerceStaging(baseURL: string | undefined): boolean {
  if (process.env.ECOMMERCE_STAGING_CONFIRMED !== 'true' || !baseURL) return false;
  try {
    const url = new URL(baseURL);
    return url.protocol === 'https:' && url.hostname !== publicHostname && !!url.hostname;
  } catch {
    return false;
  }
}
