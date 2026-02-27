import { Routes } from '@angular/router';

export const shoppingRoutes: Routes = [
  // HOME
  {
    path: '',
    loadComponent: () => import('./components/home/home').then((m) => m.Home),
  },

  // PRODUCT
  {
    path: 'product/:sku',
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
