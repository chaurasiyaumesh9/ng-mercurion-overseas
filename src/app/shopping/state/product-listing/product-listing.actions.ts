import { createAction, props } from '@ngrx/store';
import { SearchFacet } from '@shopping/models/dtos/search-facet.dto';
import { Product } from '@shopping/models/product.model';

export const loadProducts = createAction(
  '[PLP] Load Products',
  props<{
    search?: string;
    categoryId?: string;
    page: number;
    pageSize: number;
    facets: Map<string, Set<string>>;
  }>(),
);

export const loadProductsSuccess = createAction(
  '[PLP] Load Products Success',
  props<{
    products: Product[];
    total: number;
    page: number;
    pageSize: number;
    facets: SearchFacet[];
  }>(),
);

export const loadProductsFailure = createAction(
  '[PLP] Load Products Failure',
  props<{ error: string }>(),
);
