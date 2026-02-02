import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/internal/operators/map';
import { Product } from '../../../core/models/product.model';

export const featuredProductsResolver: ResolveFn<Product[]> = () => {
  const http = inject(HttpClient);
  return http.get<Product[]>(
    '../../../assets/mock-data/products/products.data.json'
  ).pipe(
    map(products => products.filter(p => p.featured))
  );
};
