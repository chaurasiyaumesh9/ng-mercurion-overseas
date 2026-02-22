import { ResolveFn } from '@angular/router';
import { Product } from '@product//models/product.model';
import { of } from 'rxjs';

export const featuredProductsResolver: ResolveFn<Product[]> = () => {
  // TODO: Implement featured products from API when available
  // Currently API only provides category-based products
  return of([]);
};
