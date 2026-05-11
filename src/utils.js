// Base44 utility for page URLs
export function createPageUrl(pageName) {
  // Remove leading slash if present
  const clean = pageName.startsWith('/') ? pageName.slice(1) : pageName;
  return `/${clean}`;
}
