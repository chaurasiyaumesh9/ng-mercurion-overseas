import { inject } from '@angular/core';
import { signalStore, withState, withComputed, withMethods, patchState } from '@ngrx/signals';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductsApi } from '../api/products.api';
import { toSignal } from '@angular/core/rxjs-interop';
import { computed, effect } from '@angular/core';
import { Observable } from 'rxjs';
import { Category } from '@entities/catalog/category.model';
import { Product } from '@product//models/product.model';
import { SearchFacet } from '@entities/catalog/search-products-response.model';

interface ListingRouteData {
  categories: Category[];
}

const facetLabels: { [key: string]: string } = {
  categoryIds: 'Categories',
  brand: 'Brand',
  color: 'Color',
  networkType: 'Network Type',
  storageCapacity: 'Storage Capacity (GB)',
  memoryRam: 'Memory (RAM)',
  screenSize: 'Screen Size (inches)',
  customerRating: 'Customer Rating',
  featured: 'Featured'
};

export interface ProductsState {
  products: Product[];
  loading: boolean;
  page: number;
  pageSize: number;
  total: number;
  facets: SearchFacet[];
  mobileFiltersOpen: boolean;
  selectedFacets: Map<string, Set<string>>;
  previousCategorySlug: string | null;
  previousSubCategorySlug: string | null;
}

export const ProductListingStore = signalStore(
  withState<ProductsState>({
    products: [],
    loading: false,
    page: 1,
    pageSize: 12,
    total: 0,
    facets: [],
    mobileFiltersOpen: false,
    selectedFacets: new Map(),
    previousCategorySlug: null,
    previousSubCategorySlug: null,
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
      pageFromUrl: computed(() => {
        const page = queryParams()?.get('page');
        return page ? parseInt(page, 10) : 1;
      }),
      pageSizeFromUrl: computed(() => {
        const pageSize = queryParams()?.get('pageSize');
        return pageSize ? parseInt(pageSize, 10) : 12;
      }),
      facetsFromUrl: computed(() => {
        const facetsMap = new Map<string, Set<string>>();
        if (!queryParams()) return facetsMap;
        
        const params = queryParams();
        // Get all query param keys
        params?.keys.forEach(key => {
          // Skip known non-facet params
          if (!['keywords', 'page', 'pageSize'].includes(key)) {
            const values = params?.getAll(key) || [];
            if (values.length > 0) {
              // Split comma-separated values
              const valueSet = new Set<string>();
              values.forEach(val => {
                val.split(',').forEach(v => v && valueSet.add(v));
              });
              if (valueSet.size > 0) {
                facetsMap.set(key, valueSet);
              }
            }
          }
        });
        return facetsMap;
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
      // API handles all filtering (search, category, facets) server-side
      // Return products as-is from API response
      return store.products();
    }),
    totalPages: computed(() => {
      return Math.ceil(store.total() / store.pageSize());
    }),
    visibleFacets: computed(() => {
      // Filter out facets with no values and add friendly labels
      return store.facets()
        .filter(facet => facet.values && facet.values.length > 0)
        .map(facet => ({
          ...facet,
          label: facetLabels[facet.field] || facet.field
        }));
    }),
  })),

  withComputed((store) => ({
    pageNumbers: computed(() => {
      const total = store.totalPages();
      const pages: number[] = [];
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
      return pages;
    }),
    visiblePageNumbers: computed(() => {
      const current = store.page();
      const total = store.totalPages();
      const pages: number[] = [];
      const start = Math.max(1, current - 2);
      const end = Math.min(total, current + 2);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      return pages;
    }),
  })),

  // Export facet labels for use in templates
  withComputed(() => ({
    facetLabels: computed(() => facetLabels),
  })),

  withMethods(
    (
      store,
      service = inject(ProductsApi),
      router = inject(Router),
      route = inject(ActivatedRoute),
    ) => {
      // Watch for route changes and auto-fetch products
      effect(() => {
        // Trigger effect whenever category, subcategory, page, page size, search, or selected facets change
        const catSlug = store.categorySlug();
        const subSlug = store.subCategorySlug();
        store.pageFromUrl();
        store.pageSizeFromUrl();
        store.search();
        const facetsFromUrl = store.facetsFromUrl();

        // Detect when category or subcategory changes and reset filters
        const categoryChanged = catSlug !== store.previousCategorySlug();
        const subcategoryChanged = subSlug !== store.previousSubCategorySlug();
        
        if (categoryChanged || subcategoryChanged) {
          patchState(store, {
            selectedFacets: new Map(),
            previousCategorySlug: catSlug,
            previousSubCategorySlug: subSlug,
          });
        } else {
          // Sync facets from URL to state
          patchState(store, { selectedFacets: new Map(facetsFromUrl) });
        }

        patchState(store, { 
          loading: true,
          page: store.pageFromUrl(),
          pageSize: store.pageSizeFromUrl(),
        });

        const searchQuery = store.search();
        
        // Determine which category ID to use
        let categoryId: string | undefined;
        const subCategory = store.currentSubCategory();
        if (subCategory) {
          categoryId = subCategory.id;
        } else {
          const category = store.currentCategory();
          if (category) {
            categoryId = category.id;
          }
        }

        // If we have a search query, prioritize it over category filtering
        if (searchQuery) {
          service.searchProducts({
            searchQuery,
            page: store.page(),
            pageSize: store.pageSize(),
            facets: store.selectedFacets(),
          }).subscribe((result) => {
            patchState(store, {
              products: result.products,
              loading: false,
              page: result.page,
              pageSize: result.pageSize,
              total: result.total,
              facets: result.facets || [],
            });
          });
        } else if (categoryId) {
          service.searchProducts({
            categoryId,
            page: store.page(),
            pageSize: store.pageSize(),
            facets: store.selectedFacets(),
          }).subscribe((result) => {
            patchState(store, {
              products: result.products,
              loading: false,
              page: result.page,
              pageSize: result.pageSize,
              total: result.total,
              facets: result.facets || [],
            });
          });
        } else {
          // No category/subcategory or search query - no products to load
          patchState(store, { products: [], loading: false, page: 1, total: 0 });
        }
      });

      return {
        setPage(pageNumber: number) {
          if (pageNumber > 0 && pageNumber <= store.totalPages()) {
            // Build path segments
            const catSlug = store.categorySlug();
            const subSlug = store.subCategorySlug();
            const pathSegments = (catSlug && subSlug) ? [catSlug, subSlug] : (catSlug ? [catSlug] : ['']);
            
            const queryParams: any = {
              page: pageNumber,
              pageSize: store.pageSize()
            };
            
            const search = store.search();
            if (search) {
              queryParams.keywords = search;
            }
            
            // Add facet query params
            store.selectedFacets().forEach((values, key) => {
              if (values.size > 0) {
                queryParams[key] = Array.from(values).join(',');
              }
            });
            
            router.navigate(pathSegments, { queryParams }).then(() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            });
          }
        },
        prevPage() {
          if (store.page() > 1) {
            const newPage = store.page() - 1;
            // Build path segments
            const catSlug = store.categorySlug();
            const subSlug = store.subCategorySlug();
            const pathSegments = (catSlug && subSlug) ? [catSlug, subSlug] : (catSlug ? [catSlug] : ['']);
            
            const queryParams: any = {
              page: newPage,
              pageSize: store.pageSize()
            };
            
            const search = store.search();
            if (search) {
              queryParams.keywords = search;
            }
            
            // Add facet query params
            store.selectedFacets().forEach((values, key) => {
              if (values.size > 0) {
                queryParams[key] = Array.from(values).join(',');
              }
            });
            
            router.navigate(pathSegments, { queryParams }).then(() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            });
          }
        },
        nextPage() {
          if (store.page() < store.totalPages()) {
            const newPage = store.page() + 1;
            // Build path segments
            const catSlug = store.categorySlug();
            const subSlug = store.subCategorySlug();
            const pathSegments = (catSlug && subSlug) ? [catSlug, subSlug] : (catSlug ? [catSlug] : ['']);
            
            const queryParams: any = {
              page: newPage,
              pageSize: store.pageSize()
            };
            
            const search = store.search();
            if (search) {
              queryParams.keywords = search;
            }
            
            // Add facet query params
            store.selectedFacets().forEach((values, key) => {
              if (values.size > 0) {
                queryParams[key] = Array.from(values).join(',');
              }
            });
            
            router.navigate(pathSegments, { queryParams }).then(() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            });
          }
        },
        setPageSize(pageSize: number) {
          if (pageSize > 0) {
            // Build path segments
            const catSlug = store.categorySlug();
            const subSlug = store.subCategorySlug();
            const pathSegments = (catSlug && subSlug) ? [catSlug, subSlug] : (catSlug ? [catSlug] : ['']);
            
            const queryParams: any = {
              page: 1,
              pageSize: pageSize
            };
            
            const search = store.search();
            if (search) {
              queryParams.keywords = search;
            }
            
            // Add facet query params
            store.selectedFacets().forEach((values, key) => {
              if (values.size > 0) {
                queryParams[key] = Array.from(values).join(',');
              }
            });
            
            router.navigate(pathSegments, { queryParams }).then(() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            });
          }
        },
        toggleMobileFilters() {
          patchState(store, { mobileFiltersOpen: !store.mobileFiltersOpen() });
        },
        toggleFacetValue(facetField: string, facetValue: string) {
          const selectedFacets = new Map(store.selectedFacets());
          let facetSet = selectedFacets.get(facetField) || new Set();
          
          if (facetSet.has(facetValue)) {
            facetSet.delete(facetValue);
          } else {
            facetSet.add(facetValue);
          }
          
          if (facetSet.size === 0) {
            selectedFacets.delete(facetField);
          } else {
            selectedFacets.set(facetField, facetSet);
          }
          
          // Build path segments
          const catSlug = store.categorySlug();
          const subSlug = store.subCategorySlug();
          const pathSegments = (catSlug && subSlug) ? [catSlug, subSlug] : (catSlug ? [catSlug] : ['']);
          
          const queryParams: any = {
            page: 1,
            pageSize: store.pageSize()
          };
          
          const search = store.search();
          if (search) {
            queryParams.keywords = search;
          }
          
          // Add facet query params
          selectedFacets.forEach((values, key) => {
            if (values.size > 0) {
              queryParams[key] = Array.from(values).join(',');
            }
          });
          
          router.navigate(pathSegments, { queryParams }).then(() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          });
        },
        isFacetValueSelected(facetField: string, facetValue: string): boolean {
          return store.selectedFacets().get(facetField)?.has(facetValue) ?? false;
        },
        clearFilters() {
          // Build path segments
          const catSlug = store.categorySlug();
          const subSlug = store.subCategorySlug();
          const pathSegments = (catSlug && subSlug) ? [catSlug, subSlug] : (catSlug ? [catSlug] : ['']);
          
          const queryParams: any = {
            page: 1,
            pageSize: store.pageSize()
          };
          
          const search = store.search();
          if (search) {
            queryParams.keywords = search;
          }
          
          router.navigate(pathSegments, { queryParams }).then(() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          });
        },
      };
    },
  ),
);
