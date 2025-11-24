export function buildApi(path: string) {
  // Get API URL from environment or use default
  const raw = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const base = raw.replace(/\/+$/g, ''); // remove trailing slashes

  // If base already ends with /api, don't add it again
  if (base.endsWith('/api')) {
    return `${base}${path.startsWith('/') ? path : '/' + path}`;
  }

  // Otherwise, prepend /api
  return `${base}/api${path.startsWith('/') ? path : '/' + path}`;
}
