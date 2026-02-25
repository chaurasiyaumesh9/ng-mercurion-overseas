import { createAction, props } from '@ngrx/store';
import { Category } from '@shopping/models/category.model';

export const loadCategories = createAction('[App] Load Categories');

export const loadCategoriesSuccess = createAction(
  '[App] Load Categories Success',
  props<{ categories: Category[] }>(),
);

export const loadCategoriesFailure = createAction(
  '[App] Load Categories Failure',
  props<{ error: string }>(),
);
