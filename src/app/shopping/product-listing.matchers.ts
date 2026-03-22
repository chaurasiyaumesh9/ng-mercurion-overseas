import { UrlSegment, UrlMatchResult } from '@angular/router';
import { PRODUCT_URL_COMPONENT_SEGMENT_REGEX } from '@core/constants/route.constants';
import { getFacetsToInclude, getTranslatorConfig } from './utils/plp-runtime-config';

export function plpMatcher(segments: UrlSegment[]): UrlMatchResult | null {
  if (!segments.length) return null;

  const fallbackUrl = (getTranslatorConfig().fallbackUrl || 'search').toLowerCase();
  const facetKeys = new Set(getFacetsToInclude().map((facet) => facet.toLowerCase()));
  const firstSegment = segments[0].path.toLowerCase();

  if (firstSegment === 'cart') {
    return null;
  }

  if (segments.length === 1 && PRODUCT_URL_COMPONENT_SEGMENT_REGEX.test(segments[0].path)) {
    return null;
  }

  const url = segments.map((s) => s.path).join('/');

  const isSearch = firstSegment === fallbackUrl;
  const isFacet = facetKeys.has(firstSegment);
  const isCategory = !isSearch && !isFacet;

  if (!(isSearch || isFacet || isCategory)) {
    return null;
  }

  const params: Record<string, UrlSegment> = {
    slug: segments[0],
    plpPath: new UrlSegment(url, {}),
  };


  return {
    consumed: segments,
    posParams: params,
  };
}
