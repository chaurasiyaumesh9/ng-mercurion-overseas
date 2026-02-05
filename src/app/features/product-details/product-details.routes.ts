import { Routes } from '@angular/router';
import { ProductDetails } from './ui/product-details/product-details';

export const productDetailsRoutes: Routes = [
    {
        path: ':categorySlug/:subCategorySlug/:productId',
        component: ProductDetails
    }
];
