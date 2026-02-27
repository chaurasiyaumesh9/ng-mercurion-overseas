import { createFeatureSelector, createSelector } from '@ngrx/store';
import { CategoriesState } from './categories.state';

export const selectCategoriesState =
  createFeatureSelector<CategoriesState>('categories');

export const selectCategories =
  createSelector(selectCategoriesState, s => s.categories);

export const selectCategoriesLoading =
  createSelector(selectCategoriesState, s => s.loading);

export const selectCategoriesLoaded =
  createSelector(selectCategoriesState, s => s.loaded);

export const selectCategoriesFeatured =
  createSelector(selectCategoriesState, s => s.categories.filter(c => c.featured));
