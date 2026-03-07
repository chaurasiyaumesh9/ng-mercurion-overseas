import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { CategoriesApi } from '@shopping/services/categories.api';
import * as CategoriesActions from './categories.actions';
import { catchError, map, switchMap, of } from 'rxjs';
import { buildCategoryHierarchy } from '@shopping/mappers/category.mapper';

@Injectable()
export class CategoriesEffects {
  private actions$ = inject(Actions);
  private categoriesApi = inject(CategoriesApi);

  loadCategories$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CategoriesActions.loadCategories),
      switchMap(() =>
        this.categoriesApi.getCategories().pipe(
          map((dtos) =>
            CategoriesActions.loadCategoriesSuccess({
              categories: buildCategoryHierarchy(dtos),
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
