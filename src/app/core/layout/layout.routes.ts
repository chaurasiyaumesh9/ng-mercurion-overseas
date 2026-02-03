import { Routes } from '@angular/router';
import { Shell } from './shell/shell';

export const LAYOUT_ROUTES: Routes = [
    {
        path: '',
        component: Shell,
        children: [
            {
                path: '',
                loadChildren: () => import('../../features/home/home.routes').then(m => m.homeRoutes)
            },
            
            {
                path: 'search',
                loadChildren: () => import('../../features/product-listing/product-listing.routes').then(m => m.productListingRoutes)
            },
            {
                path: ':categorySlug',
                loadChildren: () => import('../../features/product-listing/product-listing.routes').then(m => m.productListingRoutes)
            },
            {
                path: ':categorySlug/:subCategorySlug',
                loadChildren: () => import('../../features/product-listing/product-listing.routes').then(m => m.productListingRoutes)
            },

            {
                path: 'cart',
                loadChildren: () => import('../../features/cart/cart.routes').then(m => m.cartRoutes)
            },
            {
                path: 'checkout',
                loadChildren: () => import('../../features/checkout/checkout.routes').then(m => m.checkoutRoutes)
            },
            {
                path: 'account',
                loadChildren: () => import('../../features/account/account.routes').then(m => m.accountRoutes)
            }
        ]
    }

];
