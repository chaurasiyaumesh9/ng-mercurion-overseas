import { inject } from '@angular/core';
import { signalStore, withState, withComputed, withMethods, patchState } from '@ngrx/signals';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductsApi } from '../api/products.api';
import { toSignal } from '@angular/core/rxjs-interop';
import { computed, effect } from '@angular/core';
import { Observable } from 'rxjs';
import { Category, SubCategory } from '@entities/catalog/category.model';
import { Product } from '@product//models/product.model';

interface ListingRouteData {
  categories: Category[];
}

export interface ProductsState {
  products: Product[];
  loading: boolean;
}

export const ProductListingStore = signalStore(
  withState<ProductsState>({
    products: [],
    loading: false,
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

      // Filter by search query
      const search = store.search()?.toLowerCase()?.trim();
      if (search) {
        list = list.filter((product) => {
          return (
            product.name?.toLowerCase().includes(search) ||
            product.description?.toLowerCase().includes(search) ||
            product.category?.name?.toLowerCase().includes(search) ||
            product.subCategory?.name?.toLowerCase().includes(search)
          );
        });
      }

      return list;
    }),
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
        // Trigger effect whenever category or subcategory changes
        store.categorySlug();
        store.subCategorySlug();

        patchState(store, { loading: true });

        // If viewing a subcategory, fetch that subcategory's products
        const subCategory = store.currentSubCategory();
        if (subCategory) {
          service.getProductsByCategory(subCategory.id).subscribe((products) => {
            patchState(store, {
              products,
              loading: false,
            });
          });
          return;
        }

        // If viewing a category, fetch that category's products
        const category = store.currentCategory();
        if (category) {
          service.getProductsByCategory(category.id).subscribe((products) => {
            patchState(store, {
              products,
              loading: false,
            });
          });
          return;
        }

        // No category/subcategory - no products to load
        patchState(store, { products: [], loading: false });
      });

      return {};
    },
  ),
);
