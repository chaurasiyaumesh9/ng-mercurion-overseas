import { PLACEHOLDER_IMAGE_URL } from "@core/constants/image.constants";
import { environment } from "environments/environment";

export function resolveMediaUrl(path?: string | null): string {
  if (!path) return PLACEHOLDER_IMAGE_URL;

  if (path.startsWith('http')) {
    return path;
  }

  return `${environment.mediaBaseUrl}${path}`;
}