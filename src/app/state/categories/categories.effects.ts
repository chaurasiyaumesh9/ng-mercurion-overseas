import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { CategoriesApi } from '@shopping/services/categories.api';
import * as CategoriesActions from './categories.actions';
import { catchError, map, switchMap, of, filter } from 'rxjs';
import { mapCategoryDtosToCategories } from '@shopping/mappers/category.mapper';
import { selectCategoriesLoaded } from './categories.selectors';

@Injectable()
export class CategoriesEffects {
  private actions$ = inject(Actions);
  private categoriesApi = inject(CategoriesApi);
  private store = inject(Store);
  private loaded = this.store.selectSignal(selectCategoriesLoaded);

  loadCategories$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CategoriesActions.loadCategories),
      filter(() => !this.loaded()),
      switchMap(() =>
        this.categoriesApi.getCategories().pipe(
          map((dtos) =>
            CategoriesActions.loadCategoriesSuccess({
              categories: mapCategoryDtosToCategories(dtos),
            }),
          ),
          catchError(() =>
            of(
              CategoriesActions.loadCategoriesFailure({
                error: 'Failed to load categories',
              }),
            ),
          ),
        ),
      ),
    ),
  );
}
