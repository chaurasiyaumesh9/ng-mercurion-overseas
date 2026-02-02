import { Routes } from '@angular/router';
import { HomePage } from './home.page';
import { featuredProductsResolver } from './resolvers/featured-products.resolver';

export const homeRoutes: Routes = [
  { 
    path: '', component: HomePage ,
    resolve: {
        featuredProducts: featuredProductsResolver
    },
  }
];
