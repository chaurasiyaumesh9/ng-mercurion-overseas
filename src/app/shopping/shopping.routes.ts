import { Routes, UrlMatchResult, UrlSegment } from '@angular/router';

const SKU_SEGMENT_REGEX = /^(?=.*\d)[a-zA-Z0-9-]+$/;

function skuMatcher(segments: UrlSegment[]): UrlMatchResult | null {
  if (segments.length !== 1) return null;

  const segment = segments[0];
  if (!SKU_SEGMENT_REGEX.test(segment.path)) return null;

  return {
    consumed: [segment],
    posParams: { sku: segment },
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
    matcher: skuMatcher,
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
