import { inject, computed, effect } from '@angular/core';
import {
  signalStore,
  withState,
  withComputed,
  withMethods,
  withHooks,
  withProps,
  patchState,
} from '@ngrx/signals';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';

import * as PRODUCT_ACTION from '@shopping/state/product-listing/product-listing.actions';
import * as PRODUCT_SELECTORS from '@shopping/state/product-listing/product-listing.selectors';
import { selectCategories } from '@appState/categories/categories.selectors';

interface UiState {
  mobileFiltersOpen: boolean;
}

export const ProductListingStore = signalStore(
  withState<UiState>({
    mobileFiltersOpen: false,
  }),

  withProps(() => {
    const ngrxStore = inject(Store);
    const router = inject(Router);
    const route = inject(ActivatedRoute);

    return { ngrxStore, router, route };
  }),

  withComputed((store) => {
    const categories = store.ngrxStore.selectSignal(selectCategories);
    const products = store.ngrxStore.selectSignal(PRODUCT_SELECTORS.selectProducts);
    const loading = store.ngrxStore.selectSignal(PRODUCT_SELECTORS.selectLoading);
    const total = store.ngrxStore.selectSignal(PRODUCT_SELECTORS.selectTotal);
    const totalPages = store.ngrxStore.selectSignal(PRODUCT_SELECTORS.selectTotalPages);
    const page = store.ngrxStore.selectSignal(PRODUCT_SELECTORS.selectPage);
    const visibleFacets = store.ngrxStore.selectSignal(PRODUCT_SELECTORS.selectVisibleFacets);
    const pageSize = store.ngrxStore.selectSignal(PRODUCT_SELECTORS.selectPageSize);

    const params = toSignal(store.route.paramMap, { initialValue: null });
    const query = toSignal(store.route.queryParamMap, { initialValue: null });

    const categorySlug = computed(() => params()?.get('categorySlug') ?? null);
    const subCategorySlug = computed(() => params()?.get('subCategorySlug') ?? null);

    const currentCategory = computed(
      () => categories().find((c) => c.slug === categorySlug()) ?? null,
    );

    const currentSubCategory = computed(
      () => currentCategory()?.subCategories?.find((s) => s.slug === subCategorySlug()) ?? null,
    );

    const search = computed(() => query()?.get('keywords') ?? null);

    const pageFromUrl = computed(() => Number(query()?.get('page') ?? 1));

    const pageSizeFromUrl = computed(() => Number(query()?.get('pageSize') ?? 12));

    const facetsFromUrl = computed(() => {
      const map = new Map<string, Set<string>>();
      if (!query()) return map;
      query()?.keys.forEach((key) => {
        if (!['keywords', 'page', 'pageSize'].includes(key)) {
          const values = query()?.getAll(key) || [];
          const set = new Set<string>();
          values.forEach((v) => v.split(',').forEach((x) => x && set.add(x)));
          if (set.size) {
            map.set(key, set);
          }
        }
      });
      return map;
    });

    const visiblePageNumbers = computed(() => {
      const current = page();
      const total = totalPages();

      const start = Math.max(1, current - 2);
      const end = Math.min(total, current + 2);

      const pages: number[] = [];
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      return pages;
    });

    return {
      products,
      loading,
      total,
      totalPages,
      search,
      pageFromUrl,
      pageSizeFromUrl,
      currentCategory,
      currentSubCategory,
      facetsFromUrl,
      visiblePageNumbers,
      visibleFacets,
      pageSize,
      page,
    };
  }),

  withMethods((store) => {
    function buildQueryParams(overrides: any = {}) {
      const queryParams: any = {
        page: store.pageFromUrl(),
        pageSize: store.pageSizeFromUrl(),
      };

      const search = store.search();
      if (search) {
        queryParams.keywords = search;
      }

      const facets = store.facetsFromUrl();
      facets.forEach((values, key) => {
        if (values.size > 0) {
          queryParams[key] = Array.from(values).join(',');
        }
      });

      return { ...queryParams, ...overrides };
    }

    function dispatchLoad() {
      store.ngrxStore.dispatch(
        PRODUCT_ACTION.loadProducts({
          search: store.search() || '',
          categoryId: store.currentSubCategory()?.id ?? store.currentCategory()?.id,
          page: store.pageFromUrl(),
          pageSize: store.pageSizeFromUrl(),
          facets: store.facetsFromUrl(),
        }),
      );
    }

    function setPage(page: number) {
      store.router.navigate([], {
        relativeTo: store.route,
        queryParams: buildQueryParams({ page }),
      });
    }

    function toggleFacetValue(field: string, value: string) {
      const current = store.facetsFromUrl();
      const set = current.get(field) ?? new Set<string>();
      if (set.has(value)) set.delete(value);
      else set.add(value);
      const queryParams = buildQueryParams({ page: 1 });
      if (set.size === 0) {
        delete queryParams[field];
      } else {
        queryParams[field] = Array.from(set).join(',');
      }
      store.router.navigate([], { relativeTo: store.route, queryParams });
    }

    function isFacetValueSelected(field: string, value: string): boolean {
      const params = new URLSearchParams(window.location.search);
      const existing = params.get(field);
      if (!existing) return false;
      return existing.split(',').includes(value);
    }

    return {
      loadProducts: dispatchLoad,

      toggleMobileFilters() {
        patchState(store, {
          mobileFiltersOpen: !store.mobileFiltersOpen(),
        });
      },

      toggleFacetValue,
      isFacetValueSelected,

      setPage,

      nextPage() {
        setPage(store.pageFromUrl() + 1);
      },

      prevPage() {
        setPage(store.pageFromUrl() - 1);
      },

      setPageSize(size: number) {
        store.router.navigate([], {
          relativeTo: store.route,
          queryParams: buildQueryParams({ page: 1, pageSize: size }),
        });
      },

      clearFilters() {
        store.router.navigate([], { relativeTo: store.route, queryParams: {} });
      },
    };
  }),

  withHooks({
    onInit(store) {
      effect(() => {
        store.loadProducts();
      });
    },
  }),
);
