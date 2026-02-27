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
import { setAllEntities, withEntities } from '@ngrx/signals/entities';
import { selectCategories } from '@appState/categories/categories.selectors';
import { Product } from '@shopping/models/product.model';
import { ProductsApi } from '@shopping/services/products.api';
import { firstValueFrom } from 'rxjs/internal/firstValueFrom';
import { SearchFacet } from '@shopping/models/dtos/search-facet.dto';

interface UiState {
  mobileFiltersOpen: boolean;
}

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

export const ProductListingStore = signalStore(
  withState<UiState>({
    mobileFiltersOpen: false,
  }),

  withState({
    loading: false,
    total: 0,
    facets: [] as SearchFacet[],
  }),

  withEntities<Product>(),

  withProps(() => {
    const ngrxStore = inject(Store);
    const router = inject(Router);
    const route = inject(ActivatedRoute);
    const api = inject(ProductsApi);

    return { ngrxStore, router, route, api };
  }),

  withComputed((store) => {
    const search = computed(() => query()?.get('keywords') ?? null);
    const pageFromUrl = computed(() => Number(query()?.get('page') ?? 1));
    const pageSizeFromUrl = computed(() => Number(query()?.get('pageSize') ?? 12));
    const totalPages = computed(() => Math.ceil(store.total() / pageSizeFromUrl()));

    const categories = store.ngrxStore.selectSignal(selectCategories);
    const products = store.entities;
    const visibleFacets = computed(() =>
      store
        .facets()
        .map((f) => {
          const filteredValues = f.values?.filter((v) => v.value !== '0');

          return {
            ...f,
            values: filteredValues ?? [],
            label: facetLabels[f.field] ?? f.field,
          };
        })
        .filter((f) => f.values.length > 0),
    );

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

    const visiblePageNumbers = computed(() => {
      const current = pageFromUrl();
      const total = totalPages();

      const start = Math.max(1, current - 2);
      const end = Math.min(total, current + 2);

      const pages: number[] = [];
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      return pages;
    });

    const urlSegments = toSignal(store.route.url, { initialValue: [] });

    const facetsFromPath = computed(() => {
      const segments = urlSegments().map((s) => s.path);
      const map = new Map<string, Set<string>>();

      if (!segments.length) return map;

      // first segment = category
      let startIndex = 1;

      const knownFacetKeys = Object.keys(facetLabels);

      if (segments.length > 1 && !knownFacetKeys.includes(segments[1])) {
        startIndex = 2; // subcategory present
      }

      const facetSegments = segments.slice(startIndex);

      for (let i = 0; i < facetSegments.length; i += 2) {
        const key = facetSegments[i];
        const value = facetSegments[i + 1];
        if (!key || !value) continue;

        const set = map.get(key) ?? new Set<string>();
        set.add(value);
        map.set(key, set);
      }

      return map;
    });

    return {
      products,
      totalPages,
      search,
      pageFromUrl,
      pageSizeFromUrl,
      currentCategory,
      currentSubCategory,
      facetsFromPath,
      visiblePageNumbers,
      visibleFacets,
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

      return { ...queryParams, ...overrides };
    }

    function setPage(page: number) {
      store.router.navigate([], {
        relativeTo: store.route,
        queryParams: buildQueryParams({ page }),
      });
    }

    function toggleFacetValue(field: string, value: string) {
      const segments = store.route.snapshot.url.map((s) => s.path);

      const knownFacetKeys = Object.keys(facetLabels);

      // Determine base segments (category + optional subcategory)
      const baseSegments: string[] = [];

      if (segments.length > 0) {
        baseSegments.push(segments[0]); // category
      }

      if (segments.length > 1 && !knownFacetKeys.includes(segments[1])) {
        baseSegments.push(segments[1]); // subcategory
      }

      const currentFacets = new Map(store.facetsFromPath());
      const set = currentFacets.get(field) ?? new Set<string>();

      if (set.has(value)) {
        set.delete(value);
      } else {
        set.add(value);
      }

      if (set.size === 0) {
        currentFacets.delete(field);
      } else {
        currentFacets.set(field, set);
      }

      // rebuild facet path
      const facetSegments: string[] = [];
      currentFacets.forEach((values, key) => {
        values.forEach((v) => {
          facetSegments.push(key, v);
        });
      });

      store.router.navigate([...baseSegments, ...facetSegments], {
        queryParams: buildQueryParams({ page: 1 }),
      });
    }

    function isFacetValueSelected(field: string, value: string): boolean {
      const map = store.facetsFromPath();
      return map.get(field)?.has(value) ?? false;
    }

    return {
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
        const segments = store.route.snapshot.url.map((s) => s.path);
        const knownFacetKeys = Object.keys(facetLabels);

        const baseSegments: string[] = [];

        if (segments.length > 0) {
          baseSegments.push(segments[0]); // category
        }

        if (segments.length > 1 && !knownFacetKeys.includes(segments[1])) {
          baseSegments.push(segments[1]); // subcategory
        }

        store.router.navigate(baseSegments, {
          queryParams: {
            keywords: store.search() || null,
          },
        });
      },
    };
  }),

  withHooks({
    onInit(store) {
      effect((onCleanup) => {
        if (!store.currentCategory() && !store.search()) {
          return;
        }
        let cancelled = false;
        onCleanup(() => (cancelled = true));
        (async () => {
          patchState(store, { loading: true });

          const response = await firstValueFrom(
            store.api.searchProducts({
              categoryId: store.currentSubCategory()?.id ?? store.currentCategory()?.id,
              searchQuery: store.search() || '',
              page: store.pageFromUrl(),
              pageSize: store.pageSizeFromUrl(),
              sort: '',
              facets: store.facetsFromPath(),
            }),
          );

          if (cancelled) return;
          patchState(store, setAllEntities(response.products));
          patchState(store, {
            total: response.total,
            facets: response.facets,
            loading: false,
          });
        })();
      });
    },
  }),
);
