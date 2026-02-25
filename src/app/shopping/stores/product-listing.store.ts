import { inject } from '@angular/core';
import { signalStore, withState, withComputed, withMethods, patchState } from '@ngrx/signals';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { computed } from '@angular/core';
import { Store } from '@ngrx/store';
import { selectCategories } from '@appState/categories/categories.selectors';

interface UiState {
  mobileFiltersOpen: boolean;
}

export const ProductListingStore = signalStore(
  withState<UiState>({
    mobileFiltersOpen: false,
  }),

  withComputed(() => {
    const store = inject(Store);
    const route = inject(ActivatedRoute);

    const categories = store.selectSignal(selectCategories);

    const params = toSignal(route.paramMap, { initialValue: null });
    const query = toSignal(route.queryParamMap, { initialValue: null });

    const categorySlug = computed(() => params()?.get('categorySlug') ?? null);

    const subCategorySlug = computed(() => params()?.get('subCategorySlug') ?? null);

    const currentCategory = computed(() => {
      const slug = categorySlug();
      return categories().find((c) => c.slug === slug) ?? null;
    });

    const currentSubCategory = computed(() => {
      const cat = currentCategory();
      const subSlug = subCategorySlug();
      return cat?.subCategories?.find((s) => s.slug === subSlug) ?? null;
    });

    return {
      categorySlug,
      subCategorySlug,
      currentCategory,
      currentSubCategory,

      search: computed(() => query()?.get('keywords') ?? null),

      pageFromUrl: computed(() => {
        const p = query()?.get('page');
        return p ? parseInt(p, 10) : 1;
      }),

      pageSizeFromUrl: computed(() => {
        const s = query()?.get('pageSize');
        return s ? parseInt(s, 10) : 12;
      }),

      

      facetsFromUrl: computed(() => {
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
      }),
    };
  }),

  // --------------------------------
  // UI HELPERS
  // --------------------------------
  withMethods((store, router = inject(Router), route = inject(ActivatedRoute)) => {
    function buildQueryParams(overrides: Partial<Record<string, any>> = {}) {
      const queryParams: any = {
        page: store.pageFromUrl(),
        pageSize: store.pageSizeFromUrl(),
      };

      const search = store.search();
      if (search) queryParams.keywords = search;

      const facets = store.facetsFromUrl();
      facets.forEach((values, key) => {
        if (values.size > 0) {
          queryParams[key] = Array.from(values).join(',');
        }
      });

      return { ...queryParams, ...overrides };
    }

    function buildPathSegments() {
      const cat = store.categorySlug();
      const sub = store.subCategorySlug();

      if (cat && sub) return [cat, sub];
      if (cat) return [cat];
      return [''];
    }

    return {
      toggleMobileFilters() {
        patchState(store, {
          mobileFiltersOpen: !store.mobileFiltersOpen(),
        });
      },

      setPage(page: number) {
        router
          .navigate(buildPathSegments(), { queryParams: buildQueryParams({ page }) })
          .then(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
      },

      setPageSize(size: number) {
        router
          .navigate(buildPathSegments(), {
            queryParams: buildQueryParams({ page: 1, pageSize: size }),
          })
          .then(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
      },

      toggleFacetValue(field: string, value: string) {
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

        router.navigate([], {
          relativeTo: route,
          queryParams,
        });
      },

      isFacetValueSelected(field: string, value: string): boolean {
        const params = new URLSearchParams(window.location.search);
        const existing = params.get(field);

        if (!existing) return false;

        return existing.split(',').includes(value);
      },

      clearFilters() {
        router.navigate([], {
          relativeTo: route,
          queryParams: {},
        });
      },
    };
  }),

  withMethods((store) => {
    return {
        nextPage() {
            const page = store.pageFromUrl();
            store.setPage(page + 1);
        },

        prevPage() {
            const page = store.pageFromUrl();
            store.setPage(page - 1);
        }
    }
  }),
);
