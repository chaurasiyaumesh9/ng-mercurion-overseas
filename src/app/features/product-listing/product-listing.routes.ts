import { Routes } from '@angular/router';
import { ProductListing } from './ui/product-listing/product-listing';

export const productListingRoutes: Routes = [
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
];
