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
import { findBestCategoryPath } from '@shopping/utils/category-route.utils';
import {
  getConfiguredSortOptions,
  getFacetsToInclude,
  getTranslatorConfig,
} from '@shopping/utils/plp-runtime-config';

interface UiState {
  mobileFiltersOpen: boolean;
}

interface UiFacetValue {
  value: string;
  count: number;
}

interface UiFacet {
  field: string;
  label: string;
  values: UiFacetValue[];
}

const facetLabels: Record<string, string> = {
  categoryIds: 'Categories',
  brand: 'Brand',
  color: 'Color',
  size: 'Size',
  material: 'Material',
  style: 'Style',
  gender: 'Gender',
  custitem_ns_pr_rating: 'Customer Rating',
  custitem9: 'Gender',
  custitem4: 'Color',
  custitem6: 'Size',
};

const hiddenFacetFields = new Set([
  'custitem_deal_products',
  'category',
  'categoryIds',
  'commercecategoryname',
  'custitem_ns_sc_ext_gw_isitem',
  'custitemtop_selling',
  'pricelevel5',
]);

const translatorConfig = getTranslatorConfig();
const configuredSortOptions = getConfiguredSortOptions();
const knownFacetKeys = new Set(getFacetsToInclude().map((facet) => facet.toLowerCase()));

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
    const query = toSignal(store.route.queryParamMap, { initialValue: null });
    const urlSegmentsSignal = toSignal(store.route.url, { initialValue: [] });

    const categories = store.ngrxStore.selectSignal(selectCategories);
    const products = store.entities;

    const rawRouteSegments = computed(() =>
      urlSegmentsSignal()
        .map((segment) => segment.path)
        .filter(Boolean),
    );

    const normalizedRouteSegments = computed(() =>
      rawRouteSegments().map((segment) => segment.toLowerCase()),
    );

    const matchedCategoryPath = computed(() =>
      findBestCategoryPath(categories(), normalizedRouteSegments()),
    );

    const selectedCategory = computed(() => {
      const path = matchedCategoryPath();
      return path[path.length - 1] ?? null;
    });

    const selectedCategoryParent = computed(() => {
      const path = matchedCategoryPath();
      return path.length > 1 ? path[path.length - 2] : null;
    });

    const currentCategory = computed(() => {
      const selected = selectedCategory();
      if (!selected) return null;
      if ((selected.categories ?? []).length > 0) {
        return selected;
      }
      return selectedCategoryParent() ?? selected;
    });

    const currentSubCategory = computed(() => {
      const selected = selectedCategory();
      const current = currentCategory();
      if (!selected || !current) return null;
      return selected.internalid === current.internalid ? null : selected;
    });

    const fallbackUrl = translatorConfig.fallbackUrl.toLowerCase();

    const basePathSegments = computed(() => {
      const matchedCategory = selectedCategory();
      if (matchedCategory) {
        const routeLength = matchedCategory.fullurl
          .split('?')[0]
          .split('/')
          .filter(Boolean).length;
        return rawRouteSegments().slice(0, routeLength);
      }

      const raw = rawRouteSegments();
      const firstSegment = raw[0]?.toLowerCase();
      if (firstSegment === fallbackUrl) {
        return [raw[0]];
      }

      if (firstSegment && knownFacetKeys.has(firstSegment)) {
        return [];
      }

      return raw;
    });

    const search = computed(() => query()?.get('keywords') ?? null);
    const pageFromUrl = computed(() => Number(query()?.get('page') ?? 1));
    const pageSizeFromUrl = computed(
      () =>
        Number(query()?.get('pageSize') ?? query()?.get('show') ?? translatorConfig.defaultShow) ||
        translatorConfig.defaultShow,
    );
    const sortFromUrl = computed(() => query()?.get('order') ?? translatorConfig.defaultOrder);

    const totalPages = computed(() => Math.ceil(store.total() / pageSizeFromUrl()));

    const visibleFacets = computed<UiFacet[]>(() =>
      store
        .facets()
        .map((f) => {
          const field = f.url || f.id || '';
          const filteredValues = (f.values ?? [])
            .map((v) => ({
              value: `${v.url ?? v.label ?? ''}`,
              count: Number(v.count ?? 0),
            }))
            .filter((v) => v.value && v.value !== '0');

          return {
            field,
            values: filteredValues ?? [],
            label: facetLabels[field] ?? field,
          };
        })
        .filter((f) => !!f.field && !hiddenFacetFields.has(f.field) && f.values.length > 0),
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

    const facetsFromPath = computed(() => {
      const segments = normalizedRouteSegments();
      const map = new Map<string, Set<string>>();
      const startIndex = basePathSegments().length;
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
      sortFromUrl,
      currentCategory,
      currentSubCategory,
      selectedCategory,
      basePathSegments,
      facetsFromPath,
      visiblePageNumbers,
      visibleFacets,
      sortOptions: computed(() => configuredSortOptions),
    };
  }),

  withMethods((store) => {
    function buildQueryParams(overrides: any = {}) {
      const queryParams: any = {
        page: store.pageFromUrl(),
        pageSize: store.pageSizeFromUrl(),
        show: store.pageSizeFromUrl(),
        order: store.sortFromUrl(),
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

      const facetSegments: string[] = [];
      currentFacets.forEach((values, key) => {
        values.forEach((v) => {
          facetSegments.push(key, v);
        });
      });

      store.router.navigate([...store.basePathSegments(), ...facetSegments], {
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
          queryParams: buildQueryParams({ page: 1, pageSize: size, show: size }),
        });
      },

      setSort(order: string) {
        store.router.navigate([], {
          relativeTo: store.route,
          queryParams: buildQueryParams({ page: 1, order }),
        });
      },

      clearFilters() {
        store.router.navigate(store.basePathSegments(), {
          queryParams: buildQueryParams({ page: 1 }),
        });
      },
    };
  }),

  withHooks({
    onInit(store) {
      effect((onCleanup) => {
        if (!store.selectedCategory() && !store.search() && store.facetsFromPath().size === 0) {
          return;
        }

        let cancelled = false;
        onCleanup(() => (cancelled = true));

        (async () => {
          patchState(store, { loading: true });

          const response = await firstValueFrom(
            store.api.searchProducts({
              commerceCategoryUrl: store.selectedCategory()?.fullurl ?? undefined,
              searchQuery: store.search() || undefined,
              page: store.pageFromUrl(),
              pageSize: store.pageSizeFromUrl(),
              sort: store.sortFromUrl(),
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
