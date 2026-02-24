import { environment } from "environments/environment";

export function resolveMediaUrl(path?: string | null): string {
  if (!path) return '/assets/placeholder.png';

  // Already absolute URL
  if (path.startsWith('http')) {
    return path;
  }

  return `${environment.mediaBaseUrl}${path}`;
}