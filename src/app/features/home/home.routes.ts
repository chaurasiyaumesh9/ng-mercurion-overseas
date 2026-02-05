import { Routes } from '@angular/router';
import { Home } from './ui/home/home';
import { featuredProductsResolver } from './resolvers/featured-products.resolver';

export const homeRoutes: Routes = [
  { 
    path: '', component: Home ,
    resolve: {
        featuredProducts: featuredProductsResolver
    },
  }
];
