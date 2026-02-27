import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { ProductsApi } from '@shopping/services/products.api';
import { firstValueFrom } from 'rxjs';

export const productResolver: ResolveFn<any> = async (route) => {
  const api = inject(ProductsApi);
  const sku = route.paramMap.get('sku');

  if (!sku) return null;

  const result = await firstValueFrom(
    api.searchProducts({ sku })
  );

  return result?.products?.[0] ?? null;
};