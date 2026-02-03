import { Routes } from '@angular/router';
import { Home } from './home';
import { featuredProductsResolver } from './resolvers/featured-products.resolver';

export const homeRoutes: Routes = [
  { 
    path: '', component: Home ,
    resolve: {
        featuredProducts: featuredProductsResolver
    },
  }
];
