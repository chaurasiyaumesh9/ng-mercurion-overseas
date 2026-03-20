import { Routes, UrlMatchResult, UrlSegment } from '@angular/router';
import { PRODUCT_URL_COMPONENT_SEGMENT_REGEX } from '@core/constants/route.constants';

function homeSspEntryMatcher(segments: UrlSegment[]): UrlMatchResult | null {
  if (segments.length === 0 || segments.length > 2) return null;

  const lastSegment = segments[segments.length - 1];
  if (lastSegment.path.toLowerCase() !== 'ng-shopping.ssp') return null;

  return { consumed: [...segments] };
}

function productUrlComponentMatcher(segments: UrlSegment[]): UrlMatchResult | null {
  if (segments.length !== 1) return null;

  const segment = segments[0];
  if (!PRODUCT_URL_COMPONENT_SEGMENT_REGEX.test(segment.path)) return null;

  return {
    consumed: [segment],
    posParams: { urlcomponent: segment },
  };
}

export const shoppingRoutes: Routes = [
  // HOME
  {
    path: '',
    loadComponent: () => import('./components/home/home').then((m) => m.Home),
  },
  {
    matcher: homeSspEntryMatcher,
    loadComponent: () => import('./components/home/home').then((m) => m.Home),
  },

  // PRODUCT
  {
    matcher: productUrlComponentMatcher,
    loadComponent: () =>
      import('./components/product-details/product-details').then((m) => m.ProductDetails),
  },

  // CART
  {
    path: 'cart',
    loadComponent: () => import('./components/cart/cart').then((m) => m.Cart),
  },

  // SEARCH + FACETS
  {
    path: 'search',
    loadComponent: () =>
      import('./components/product-listing/product-listing').then((m) => m.ProductListing),
  },
  {
    path: 'search/**',
    loadComponent: () =>
      import('./components/product-listing/product-listing').then((m) => m.ProductListing),
  },

  // CATEGORY + FACETS
  {
    path: ':categorySlug',
    loadComponent: () =>
      import('./components/product-listing/product-listing').then((m) => m.ProductListing),
  },
  {
    path: ':categorySlug/:subCategorySlug',
    loadComponent: () =>
      import('./components/product-listing/product-listing').then((m) => m.ProductListing),
  },
  {
    path: ':categorySlug/:subCategorySlug/**',
    loadComponent: () =>
      import('./components/product-listing/product-listing').then((m) => m.ProductListing),
  },
];

