import { Routes } from '@angular/router';
import { Shell } from './shell/shell';
import { ProductsService } from '../../features/product-listing/services/products.service';

export const LAYOUT_ROUTES: Routes = [
    {
        path: '',
        component: Shell,
        children: [
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
            },
            {
                path: '',
                loadChildren: () => import('../../features/home/home.routes').then(m => m.homeRoutes)
            },
            {
                path: '',
                providers: [ProductsService],
                loadChildren: () => import('../../features/product-listing/product-listing.routes').then(m => m.productListingRoutes)
            },
            {
                path: '',
                loadChildren: () => import('../../features/product-details/product-details.routes').then(m => m.productDetailsRoutes)
            },            
        ]
    }

];
