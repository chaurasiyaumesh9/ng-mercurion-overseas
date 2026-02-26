import { Routes } from '@angular/router';

export const shoppingRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'cart',
        loadComponent: () => import('./components/cart/cart').then((m) => m.Cart),
      },
      {
        path: '',
        loadComponent: () => import('./components/home/home').then((m) => m.Home),
      },
      {
        path: '',
        children: [
          {
            path: 'search',
            loadComponent: () => import('./components/product-listing/product-listing').then((m) => m.ProductListing),
          },
          {
            path: ':categorySlug',
            loadComponent: () => import('./components/product-listing/product-listing').then((m) => m.ProductListing),
          },
          {
            path: ':categorySlug/:subCategorySlug',
            loadComponent: () => import('./components/product-listing/product-listing').then((m) => m.ProductListing),
          },
        ],
      },
      {
        path: '',
        loadComponent: () =>
          import('./components/product-details/product-details').then((m) => m.ProductDetails),
      },
    ],
  },
];
