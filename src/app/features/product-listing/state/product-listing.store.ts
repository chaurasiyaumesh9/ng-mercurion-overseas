import { inject } from '@angular/core';
import { signalStore, withState, withComputed, withMethods, patchState } from '@ngrx/signals';
import { ActivatedRoute } from '@angular/router';
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
  sortBy: 'featured' | 'price-low' | 'price-high' | 'rating' | 'name';
  priceRange: [number, number];
  selectedCategories: string[];
  selectedSubCategories: string[];
  mobileFiltersOpen: boolean;
  expandedFacets: Set<string>;
  page: number;
  pageSize: number;
}

export const ProductListingStore = signalStore(
  withState<ProductsState>({
    products: [],
    loading: false,
    sortBy: 'featured',
    priceRange: [0, 50000] as [number, number],
    selectedCategories: [] as string[],
    selectedSubCategories: [] as string[],
    mobileFiltersOpen: false,
    expandedFacets: new Set<string>(),
    page: 1,
    pageSize: 12,
  }),

  withComputed(() => {
    const route = inject(ActivatedRoute);

    // Convert route observables to signals
    const routeParams = toSignal(route.paramMap, { initialValue: null });
    const queryParams = toSignal(route.queryParamMap, { initialValue: null });
    const categories = toSignal(route.data as Observable<ListingRouteData>, {
      initialValue: { categories: [] },
    });

    // Derive filter values from route as computed signals
    return {
      categories: computed(() => categories().categories),
      categorySlug: computed(() => routeParams()?.get('categorySlug') ?? null),
      subCategorySlug: computed(() => routeParams()?.get('subCategorySlug') ?? null),
      search: computed(() => queryParams()?.get('keywords') ?? null),
    };
  }),

  withComputed((store) => ({
    categoryById: computed(() => {
      const map = new Map<string, Category>();

      for (const cat of store.categories()) {
        map.set(cat.id, cat);
      }

      return map;
    }),
    filteredProducts: computed(() => {
      let list = store.products();

      // 1. Route-based filters (menu navigation)
      if (store.categorySlug()) {
        list = list.filter((p) => p.category.slug === store.categorySlug());
      }

      if (store.subCategorySlug()) {
        list = list.filter((p) => p.subCategory.slug === store.subCategorySlug());
      }

      // 2. Facet filters (checkboxes)
      if (store.selectedCategories().length > 0) {
        list = list.filter((p) => store.selectedCategories().includes(p.category.slug));
      }

      if (store.selectedSubCategories().length > 0) {
        list = list.filter((p) => store.selectedSubCategories().includes(p.subCategory.slug));
      }

      list = list.filter(
        (p) => p.price >= store.priceRange()[0] && p.price <= store.priceRange()[1],
      );

      switch (store.sortBy()) {
        case 'price-low':
          list.sort((a, b) => a.price - b.price);
          break;
        case 'price-high':
          list.sort((a, b) => b.price - a.price);
          break;
        case 'rating':
          list.sort((a, b) => b.rating - a.rating);
          break;
        case 'name':
          list.sort((a, b) => a.name.localeCompare(b.name));
          break;
        default:
          list.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
      }

      return list;
    }),
  })),

  withComputed((store) => ({
    // NEW: Derive display names from products
    categoryName: computed(() => {
      const products = store.filteredProducts();
      return products.length > 0 && store.categorySlug() ? products[0].category.name : null;
    }),

    subCategoryName: computed(() => {
      const products = store.filteredProducts();
      return products.length > 0 && store.subCategorySlug() ? products[0].subCategory.name : null;
    }),

    currentCategory: computed(() => {
      const products = store.filteredProducts();
      if (!products.length) return null;

      const categoryId = products[0].category?.id;
      if (!categoryId) return null;

      return store.categoryById().get(categoryId) ?? null;
    }),

    subCategoryById: computed(() => {
      const map = new Map<string, SubCategory>();

      for (const cat of store.categories()) {
        for (const sub of cat.subCategories ?? []) {
          map.set(sub.id, sub);
        }
      }

      return map;
    }),

    currentSubCategory: computed(() => {
      const products = store.filteredProducts();
      if (!products.length) return null;

      const subId = products[0]?.subCategory?.id;
      if (!subId) return null;

      for (const cat of store.categories()) {
        const sub = cat.subCategories?.find((s) => s.id === subId);
        if (sub) return sub;
      }

      return null;
    }),
  })),

  withComputed((store) => ({
    totalPages: computed(() =>
      Math.max(1, Math.ceil(store.filteredProducts().length / store.pageSize())),
    ),
  })),

  withComputed((store) => ({
    activeFacetConfig: computed(() => {
      const sub = store.currentSubCategory();
      if (sub?.facets?.length) {
        // Subcategory page → ONLY sub facets
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

    facetValuesMap: computed(() => {
      const map = new Map<string, Set<string | number | boolean>>();
      const products = store.filteredProducts();

      for (const p of products) {
        if (!p.facets) continue;

        for (const [key, value] of Object.entries(p.facets)) {
          if (!map.has(key)) map.set(key, new Set());

          if (Array.isArray(value)) {
            value.forEach((v) => map.get(key)?.add(v));
          } else {
            map.get(key)?.add(value);
          }
        }
      }

      // Convert Set → sorted array
      const result = new Map<string, (string | number | boolean)[]>();

      map.forEach((set, key) => {
        result.set(key, Array.from(set).sort());
      });

      return result;
    }),
  })),

  withComputed((store) => ({
    totalItems: computed(() => store.filteredProducts().length),

    paginatedProducts: computed(() => {
      const start = (store.page() - 1) * store.pageSize();
      return store.filteredProducts().slice(start, start + store.pageSize());
    }),

    pageNumbers: computed(() => Array.from({ length: store.totalPages() }, (_, i) => i + 1)),

    visiblePageNumbers: computed(() => {
      const total = store.totalPages();
      const current = store.page();

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

  withMethods((store, service = inject(ProductsApi)) => ({
    init() {
      patchState(store, { loading: true });

      service.getProducts().subscribe((products) => {
        patchState(store, {
          products,
          loading: false,
        });
      });
    },
    toggleCategory(category: string) {
      patchState(store, (state) => ({
        selectedCategories: state.selectedCategories.includes(category)
          ? state.selectedCategories.filter((c) => c !== category)
          : [...state.selectedCategories, category],
        page: 1,
      }));
    },

    toggleSubCategory(sub: string) {
      patchState(store, (state) => ({
        selectedSubCategories: state.selectedSubCategories.includes(sub)
          ? state.selectedSubCategories.filter((c) => c !== sub)
          : [...state.selectedSubCategories, sub],
        page: 1,
      }));
    },

    clearFilters() {
      patchState(store, {
        selectedCategories: [],
        selectedSubCategories: [],
        priceRange: [0, 500],
        page: 1,
      });
    },

    // ---------- pagination ----------
    setPage(page: number) {
      if (page < 1 || page > store.totalPages()) return;

      patchState(store, { page });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    nextPage() {
      this.setPage(store.page() + 1);
    },

    prevPage() {
      this.setPage(store.page() - 1);
    },

    setPageSize(size: number) {
      patchState(store, {
        pageSize: size,
        page: 1,
      });
    },

    resetPagination() {
      patchState(store, { page: 1 });
    },

    // ---------- sorting ----------
    setSortBy(sort: ProductsState['sortBy']) {
      patchState(store, {
        sortBy: sort,
        page: 1,
      });
    },

    // ---------- price ----------
    setPriceRange(range: [number, number]) {
      patchState(store, {
        priceRange: range,
        page: 1,
      });
    },

    // ---------- mobile ----------
    openMobileFilters() {
      patchState(store, { mobileFiltersOpen: true });
    },

    closeMobileFilters() {
      patchState(store, { mobileFiltersOpen: false });
    },

    toggleMobileFilters() {
      const next = !store.mobileFiltersOpen();

      patchState(store, { mobileFiltersOpen: next });

      // If closing → reset expanded UI
      if (!next) {
        this.resetFacetUIState();
      }
    },

    resetFacetUIState() {
      patchState(store, {
        expandedFacets: new Set<string>(),
      });
    },

    facetValues: (facetKey: string) => {
      const products = store.filteredProducts();

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
  })),
);
