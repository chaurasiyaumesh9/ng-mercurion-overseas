import { createFeatureSelector, createSelector } from '@ngrx/store';
import { CategoriesState } from './categories.state';

export const selectCategoriesState =
  createFeatureSelector<CategoriesState>('categories');

export const selectCategories =
  createSelector(selectCategoriesState, s => s.categories);

export const selectCategoriesLoaded =
  createSelector(selectCategoriesState, s => s.loaded);