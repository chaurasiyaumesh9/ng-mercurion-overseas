import { ResolveFn } from '@angular/router';
import { inject } from '@angular/core';
import { Product } from '@product//models/product.model';
import { map } from 'rxjs';
import { ProductsApi, SearchProductsResult } from '@product-listing/api/products.api';

export const featuredProductsResolver: ResolveFn<Product[]> = () => {
  const productsApi = inject(ProductsApi);
  return productsApi.searchProducts({ featured: true }).pipe(
    map((result: SearchProductsResult) => result.products)
  );
};
