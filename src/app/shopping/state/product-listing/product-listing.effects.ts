import { inject, Injectable } from '@angular/core';
import { Actions, createEffect } from '@ngrx/effects';
import { ProductsApi } from '@shopping/services/products.api';
import * as PRODUCT_LISTING_ACTION from './product-listing.actions';
import { ofType } from '@ngrx/effects';
import { switchMap, map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Injectable()
export class ProductListingEffects {
  private actions$ = inject(Actions);
  private api = inject(ProductsApi);

  loadProducts$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PRODUCT_LISTING_ACTION.loadProducts),
      switchMap((action) =>
        this.api
          .searchProducts({
            searchQuery: action.search,
            categoryId: action.categoryId,
            page: action.page,
            pageSize: action.pageSize,
            facets: action.facets,
          })
          .pipe(
            map((result) =>
              PRODUCT_LISTING_ACTION.loadProductsSuccess({
                products: result.products,
                total: result.total,
                page: result.page,
                pageSize: result.pageSize,
                facets: result.facets ?? [],
              }),
            ),
            catchError(() =>
              of(
                PRODUCT_LISTING_ACTION.loadProductsFailure({
                  error: 'Failed to load products',
                }),
              ),
            ),
          ),
      ),
    ),
  );
}
