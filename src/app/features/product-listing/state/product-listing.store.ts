import { inject } from '@angular/core';
import { signalStore, withState, withComputed, withMethods, patchState } from '@ngrx/signals';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductsApi } from '../api/products.api';
import { toSignal } from '@angular/core/rxjs-interop';
import { computed } from '@angular/core';
import { Observable } from 'rxjs';
import { Category, SubCategory } from '@entities/catalog/category.model';
import { Product } from '@product//models/product.model';
import { FacetConfig } from '@entities/catalog/facet.model';

interface ListingRouteData {
  categories: Category[];
}

export interface ProductsState {
  products: Product[];
  loading: boolean;
  priceRange: [number, number];
  mobileFiltersOpen: boolean;
  expandedFacets: Set<string>;
  page: number;
  pageSize: number;  
}

export const ProductListingStore = signalStore(
  withState<ProductsState>({
    products: [],
    loading: false,
    priceRange: [0, 50000] as [number, number],
    mobileFiltersOpen: false,
    expandedFacets: new Set<string>(),
    page: 1,
    pageSize: 12,    
  }),

  withComputed(() => {
    const route = inject(ActivatedRoute);
    const routeParams = toSignal(route.paramMap, { initialValue: null });
    const queryParams = toSignal(route.queryParamMap, { initialValue: null });
    const categories = toSignal(route.data as Observable<ListingRouteData>, {
      initialValue: { categories: [] },
    });

    return {
      categories: computed(() => categories().categories),
      categorySlug: computed(() => routeParams()?.get('categorySlug') ?? null),
      subCategorySlug: computed(() => routeParams()?.get('subCategorySlug') ?? null),
      search: computed(() => queryParams()?.get('keywords') ?? null),
      routeParams,
      queryParams,
      pageFromUrl: computed(() => {
        const p = queryParams()?.get('page');
        return p ? Number(p) : 1;
      }),
      pageSizeFromUrl: computed(() => {
        const p = queryParams()?.get('pageSize');
        return p ? Number(p) : 12;
      }),
      selectedFacetValuesFromUrl: computed(() => {
        const qp = queryParams();
        if (!qp) return {};

        const result: Record<string, Set<any>> = {};

        qp.keys.forEach((key) => {
          if (['page', 'pageSize', 'keywords'].includes(key)) return;

          const values = qp.getAll(key);
          if (!values.length) return;

          result[key] = new Set(values);
        });

        return result;
      }),
    };
  }),

  withComputed((store) => {
    const currentCategory = computed(() => {
      const slug = store.categorySlug();
      if (!slug) return null;

      return store.categories().find((c) => c.slug === slug) ?? null;
    });

    const currentSubCategory = computed(() => {
      const catSlug = store.categorySlug();
      const subSlug = store.subCategorySlug();

      if (!catSlug || !subSlug) return null;

      const category = store.categories().find((c) => c.slug === catSlug);
      if (!category) return null;

      return category.subCategories?.find((s) => s.slug === subSlug) ?? null;
    });
    return {
      currentCategory,
      currentSubCategory,
    };
  }),

  withComputed((store) => ({
    filteredProducts: computed(() => {
      let list = store.products();

      // 1. Route-based filters (menu navigation)
      if (store.categorySlug()) {
        list = list.filter((p) => p.category.slug === store.categorySlug());
      }

      if (store.subCategorySlug()) {
        list = list.filter((p) => p.subCategory.slug === store.subCategorySlug());
      }

      list = list.filter(
        (p) => p.price >= store.priceRange()[0] && p.price <= store.priceRange()[1],
      );

      const search = store.search()?.toLowerCase()?.trim();

      if (search) {
        list = list.filter((p) => {
          return (
            p.name?.toLowerCase().includes(search) ||
            p.description?.toLowerCase().includes(search) ||
            p.category?.name?.toLowerCase().includes(search) ||
            p.subCategory?.name?.toLowerCase().includes(search)
          );
        });
      }

      // ================= FACET FILTER =================
      const selected = store.selectedFacetValuesFromUrl();

      const activeFacetKeys = Object.keys(selected).filter((k) => selected[k]?.size);

      if (activeFacetKeys.length) {
        list = list.filter((product) => {
          return activeFacetKeys.every((facetKey) => {
            const selectedValues = selected[facetKey];
            const productValue = product.facets?.[facetKey];

            if (!selectedValues || !selectedValues.size) return true;

            if (Array.isArray(productValue)) {
              return productValue.some((v) => selectedValues.has(v));
            }

            return selectedValues.has(productValue);
          });
        });
      }

      return list;
    }),
  })),

  withComputed((store) => ({
    totalPages: computed(() =>
      Math.ceil(store.filteredProducts().length / store.pageSizeFromUrl()),
    ),
  })),

  withComputed((store) => ({
    activeFacetConfig: computed(() => {
      const sub = store.currentSubCategory();
      if (sub?.facets?.length) {
        return sub.facets;
      }

      const cat = store.currentCategory();
      if (!cat) return [];

      // Category page → category + all subcategory facets
      const facetMap = new Map<string, FacetConfig>();

      // Add category facets
      cat.facets?.forEach((f) => facetMap.set(f.key, f));

      // Add ALL subcategory facets
      cat.subCategories?.forEach((sub) => {
        sub.facets?.forEach((f) => {
          if (!facetMap.has(f.key)) {
            facetMap.set(f.key, f);
          }
        });
      });

      return Array.from(facetMap.values());
    }),
  })),

  withComputed((store) => ({
    paginatedProducts: computed(() => {
      const start = (store.pageFromUrl() - 1) * store.pageSizeFromUrl();
      return store.filteredProducts().slice(start, start + store.pageSizeFromUrl());
    }),

    pageNumbers: computed(() => Array.from({ length: store.totalPages() }, (_, i) => i + 1)),

    visiblePageNumbers: computed(() => {
      const total = store.totalPages();
      const current = store.pageFromUrl();

      const windowSize = 5; // mobile max buttons

      let start = Math.max(1, current - Math.floor(windowSize / 2));
      let end = start + windowSize - 1;

      if (end > total) {
        end = total;
        start = Math.max(1, end - windowSize + 1);
      }

      return Array.from({ length: end - start + 1 }, (_, i) => start + i);
    }),
  })),

  withMethods(
    (
      store,
      service = inject(ProductsApi),
      router = inject(Router),
      route = inject(ActivatedRoute),
    ) => ({
      getProductsFilteredExceptFacet(facetKey: string) {
        let products = store.products();

        // Apply category
        if (store.categorySlug()) {
          products = products.filter((p) => p.category?.slug === store.categorySlug());
        }

        // Apply subcategory
        if (store.subCategorySlug()) {
          products = products.filter((p) => p.subCategory?.slug === store.subCategorySlug());
        }

        // Apply search
        const search = store.search()?.toLowerCase()?.trim();
        if (search) {
          products = products.filter((p) => p.name?.toLowerCase().includes(search));
        }

        // Apply OTHER facets only
        const selected = store.selectedFacetValuesFromUrl();

        const activeFacetKeys = Object.keys(selected).filter(
          (k) => k !== facetKey && selected[k]?.size,
        );

        if (activeFacetKeys.length) {
          products = products.filter((product) => {
            return activeFacetKeys.every((key) => {
              const selectedValues = selected[key];
              const productValue = product.facets?.[key];

              if (Array.isArray(productValue)) {
                return productValue.some((v) => selectedValues.has(v));
              }

              return selectedValues.has(productValue);
            });
          });
        }

        return products;
      },
    }),
  ),

  withMethods(
    (
      store,
      service = inject(ProductsApi),
      router = inject(Router),
      route = inject(ActivatedRoute),
    ) => ({
      init() {
        patchState(store, { loading: true });

        service.getProducts().subscribe((products) => {
          patchState(store, {
            products,
            loading: false,
          });
        });
      },

      // ---------- pagination ----------
      setPage(page: number) {
        const qp = store.queryParams();
        if (!qp) return;

        const total = store.totalPages();
        if (page < 1 || page > total) return;

        const params: any = {};

        qp.keys.forEach((k) => {
          const values = qp.getAll(k);
          params[k] = values.length > 1 ? values : qp.get(k);
        });

        params.page = page;

        router.navigate([], { queryParams: params });
      },

      nextPage() {
        this.setPage(store.pageFromUrl() + 1);
      },

      prevPage() {
        this.setPage(store.pageFromUrl() - 1);
      },

      setPageSize(size: number) {
        const qp = store.queryParams();
        if (!qp) return;

        const params: any = {};

        qp.keys.forEach((k) => {
          const values = qp.getAll(k);
          params[k] = values.length > 1 ? values : qp.get(k);
        });

        params.pageSize = size;
        params.page = 1;

        router.navigate([], { queryParams: params });
      },

      toggleMobileFilters() {
        const next = !store.mobileFiltersOpen();

        patchState(store, { mobileFiltersOpen: next });

        // If closing → reset expanded UI
        if (!next) {
          patchState(store, {
            expandedFacets: new Set<string>(),
            });
        }
      },

      facetValues: (facetKey: string) => {
        const products = store.getProductsFilteredExceptFacet(facetKey);

        const set = new Set<any>();

        for (const p of products) {
          const val = p.facets?.[facetKey];

          if (val === undefined || val === null) continue;

          if (Array.isArray(val)) {
            val.forEach((v) => set.add(v));
          } else {
            set.add(val);
          }
        }

        return Array.from(set).sort();
      },

      toggleFacetExpand(key: string) {
        const next = new Set(store.expandedFacets());

        if (next.has(key)) next.delete(key);
        else next.add(key);

        patchState(store, { expandedFacets: next });
      },
      isFacetExpanded(key: string) {
        return store.expandedFacets().has(key);
      },

      toggleFacetValue(facetKey: string, value: any) {
        const qp = store.queryParams();
        if (!qp) return;

        const params: any = {};

        qp.keys.forEach((k) => {
          const values = qp.getAll(k);
          params[k] = values.length > 1 ? values : qp.get(k);
        });

        let values = params[facetKey]
          ? Array.isArray(params[facetKey])
            ? [...params[facetKey]]
            : [params[facetKey]]
          : [];

        if (values.includes(value)) values = values.filter((v) => v !== value);
        else values.push(value);

        if (values.length) params[facetKey] = values;
        else delete params[facetKey];

        params.page = 1;

        router.navigate([], { queryParams: params });
      },
      resetAllFilters() {
        patchState(store, {
          expandedFacets: new Set<string>(),
          page: 1,
          mobileFiltersOpen: false,
        });
      },
    }),
  ),
);
