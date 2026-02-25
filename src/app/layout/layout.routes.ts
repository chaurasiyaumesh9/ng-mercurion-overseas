import { Routes } from '@angular/router';
import { Shell } from '../layout/shell/shell';

export const LAYOUT_ROUTES: Routes = [
    {
        path: '',
        component: Shell,
        children: [
            {
                path: 'checkout',
                loadChildren: () => import('../checkout/checkout.routes').then(m => m.checkoutRoutes)
            },
            {
                path: 'account',
                loadChildren: () => import('../account/account.routes').then(m => m.accountRoutes)
            },
            {
                path: '',
                loadChildren: () => import('../shopping/shopping.routes').then(m => m.shoppingRoutes)
            },            
        ]
    }

];
