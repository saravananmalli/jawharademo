const API_ORIGIN = (() => {
  try {
    const url = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return 'http://localhost:5001';
  }
})();

export function getImageUrl(path) {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${API_ORIGIN}${path}`;
}
