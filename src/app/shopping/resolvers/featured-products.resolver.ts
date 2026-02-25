import { ResolveFn } from '@angular/router';
import { inject } from '@angular/core';
import { Product } from '@shopping/models/product.model';
import { ProductsApi, SearchProductsResult } from '@shopping/services/products.api';
import { map } from 'rxjs/internal/operators/map';

export const featuredProductsResolver: ResolveFn<Product[]> = () => {
  const productsApi = inject(ProductsApi);
  return productsApi.searchProducts({ featured: true }).pipe(
    map((result: SearchProductsResult) => result.products)
  );
};
