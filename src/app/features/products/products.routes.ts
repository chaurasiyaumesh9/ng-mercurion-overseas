import { Routes } from '@angular/router';
import { ProductsPage } from './products.page';
import { ProductsService } from './services/products.service';

export const productsRoutes: Routes = [
  {
    path: '',
    providers: [
        ProductsService
    ],
    component: ProductsPage
  }
];
