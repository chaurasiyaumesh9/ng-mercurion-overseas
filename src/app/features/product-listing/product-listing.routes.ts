import { Routes } from '@angular/router';
import { ProductListing } from './product-listing';
import { ProductsService } from './services/products.service';

export const productListingRoutes: Routes = [
  {
    path: '',
    providers: [
        ProductsService
    ],
    component: ProductListing
  }
];
