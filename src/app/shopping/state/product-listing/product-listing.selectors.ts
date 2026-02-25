import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ProductListingState } from './product-listing.state';
import { SearchFacet } from '@shopping/models/dtos/search-facet.dto';

export const selectProductListingState =
  createFeatureSelector<ProductListingState>('productListing');

  const facetLabels: Record<string, string> = {
  categoryIds: 'Categories',
  brand: 'Brand',
  color: 'Color',
  networkType: 'Network Type',
  storageCapacity: 'Storage Capacity (GB)',
  memoryRam: 'Memory (RAM)',
  screenSize: 'Screen Size (inches)',
  customerRating: 'Customer Rating',
  featured: 'Featured',
};

export interface FacetVM extends SearchFacet {
  label: string;
}

export const selectVisibleFacets = createSelector(
  selectProductListingState,
  (state): FacetVM[] =>
    state.facets
      .filter(f => f.values?.length > 0)
      .map(f => ({
        ...f,
        label: facetLabels[f.field] ?? f.field,
      }))
);

export const selectProducts = createSelector(selectProductListingState, (s) => s.products);

export const selectLoading = createSelector(selectProductListingState, (s) => s.loading);

export const selectTotal = createSelector(selectProductListingState, (s) => s.total);

export const selectPage = createSelector(selectProductListingState, (s) => s.page);

export const selectPageSize = createSelector(selectProductListingState, (s) => s.pageSize);

export const selectFacets = createSelector(selectProductListingState, (s) => s.facets);

export const selectTotalPages = createSelector(selectTotal, selectPageSize, (total, pageSize) =>
  Math.ceil(total / pageSize),
);

export const selectPageNumbers = createSelector(
  selectTotalPages,
  total => Array.from({ length: total }, (_, i) => i + 1)
);