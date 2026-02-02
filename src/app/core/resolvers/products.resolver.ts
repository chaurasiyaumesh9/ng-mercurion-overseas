import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Product } from '../models/product.model';

export const productsResolver: ResolveFn<Product[]> = () => {
  const http = inject(HttpClient);
  return http.get<Product[]>(
    '../../../assets/mock-data/products/products.data.json'
  );
};
