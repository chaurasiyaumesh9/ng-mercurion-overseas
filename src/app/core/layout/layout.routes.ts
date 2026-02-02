import { Routes } from '@angular/router';
import { ShellComponent } from './shell/shell.component';

export const LAYOUT_ROUTES: Routes = [
    {
        path: '',
        component: ShellComponent,
        children: [
            {
                path: '',
                loadChildren: () => import('../../features/home/home.routes').then(m => m.homeRoutes)
            },
            
            {
                path: 'search',
                loadChildren: () => import('../../features/products/products.routes').then(m => m.productsRoutes)
            },
            {
                path: ':categorySlug',
                loadChildren: () => import('../../features/products/products.routes').then(m => m.productsRoutes)
            },
            {
                path: ':categorySlug/:subCategorySlug',
                loadChildren: () => import('../../features/products/products.routes').then(m => m.productsRoutes)
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
