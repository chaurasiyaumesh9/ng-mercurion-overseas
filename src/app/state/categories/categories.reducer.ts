import { createReducer, on } from '@ngrx/store';
import * as CategoriesActions from './categories.actions';
import { CategoriesState } from './categories.state';

export const initialState: CategoriesState = {
  categories: [],
  loading: false,
  loaded: false,
  error: null,
};

export const categoriesReducer = createReducer(
  initialState,

  on(CategoriesActions.loadCategories, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(CategoriesActions.loadCategoriesSuccess, (state, { categories }) => ({
    ...state,
    categories,
    loading: false,
    loaded: true,
  })),

  on(CategoriesActions.loadCategoriesFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),
);
