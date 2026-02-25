import { createReducer, on } from '@ngrx/store';
import { ProductListingState } from './product-listing.state';
import * as PRODUCT_LISTING_ACTION from './product-listing.actions';

export const initialState: ProductListingState = {
  products: [],
  loading: false,
  total: 0,
  page: 1,
  pageSize: 12,
  facets: [],
  error: null,
};

export const productListingReducer = createReducer(
  initialState,

  on(PRODUCT_LISTING_ACTION.loadProducts, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(PRODUCT_LISTING_ACTION.loadProductsSuccess, (state, payload) => ({
    ...state,
    loading: false,
    products: payload.products,
    total: payload.total,
    page: payload.page,
    pageSize: payload.pageSize,
    facets: payload.facets,
  })),

  on(PRODUCT_LISTING_ACTION.loadProductsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),
);
