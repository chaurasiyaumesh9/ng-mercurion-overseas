import { Routes } from '@angular/router';
import { ProductsApi } from '@shopping/services/products.api';
import { ProductListing } from './components/product-listing/product-listing';

export const shoppingRoutes: Routes = [
    {
        path: 'cart',
        loadComponent: () => import('./components/cart/cart').then(m => m.Cart)
    },
    {
        path: '',
        loadComponent: () => import('./components/home/home').then(m => m.Home)
    },
    {
        path: '',
        providers: [ProductsApi],
        children: [
            {
                path: 'search',
                component: ProductListing
            },
            {
                path: ':categorySlug',
                component: ProductListing
            },
            {
                path: ':categorySlug/:subCategorySlug',
                component: ProductListing
            }
        ]
    },
    {
        path: '',
        loadComponent: () => import('./components/product-details/product-details').then(m => m.ProductDetails)
    },
];
