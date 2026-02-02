import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { ProductsService } from '../services/products.service';
import { Product } from '../../../core/models/product.model';

export const productsResolver: ResolveFn<Product[]> = () => {
  const service = inject(ProductsService);
  return service.getProducts();
};
