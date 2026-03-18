import { Routes, UrlMatchResult, UrlSegment } from '@angular/router';
import { PRODUCT_URL_COMPONENT_SEGMENT_REGEX } from '@core/constants/route.constants';

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

