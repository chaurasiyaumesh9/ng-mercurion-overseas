import { Routes } from '@angular/router';
import { ProductDetails } from './product-details';


export const productDetailsRoutes: Routes = [
    {
        path: ':categorySlug/:subCategorySlug/:productId',
        component: ProductDetails
    }
];
