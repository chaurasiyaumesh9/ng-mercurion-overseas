import { computed, inject, effect } from '@angular/core';
import { selectCategoriesFeatured, selectCategoriesLoaded } from '@appState/categories/categories.selectors';
import { PLACEHOLDER_IMAGE_URL } from '@core/constants/image.constants';
import {
  signalStore,
  withState,
  withComputed,
  withMethods,
  withHooks,
  withProps,
  patchState,
} from '@ngrx/signals';
import { Store } from '@ngrx/store';
import { Category } from '@shopping/models/category.model';
import { Product } from '@shopping/models/product.model';
import { ProductsApi } from '@shopping/services/products.api';
import { firstValueFrom } from 'rxjs/internal/firstValueFrom';

interface HomeState {
  featuredProducts: Product[];
  loading: boolean;
  failedCategoryImages: Set<string>;
}

export const HomeStore = signalStore(
  withState<HomeState>(() => ({
    featuredProducts: [],
    loading: false,
    failedCategoryImages: new Set<string>(),
  })),

  withProps(() => {
    const ngrxStore = inject(Store);
    return {
      ngrxStore,
      api: inject(ProductsApi),
      featuredCategoriesSignal: ngrxStore.selectSignal(selectCategoriesFeatured),
      categoriesLoadedSignal: ngrxStore.selectSignal(selectCategoriesLoaded),
    };
  }),

  withComputed((store) => ({
    featuredCategories: computed(() => store.featuredCategoriesSignal()),
    categoriesLoaded: computed(() => store.categoriesLoadedSignal()),
  })),

  withHooks({
    onInit(store) {
      effect((onCleanup) => {
        let cancelled = false;
        onCleanup(() => (cancelled = true));

        (async () => {
          patchState(store, { loading: true });

          const featuredProducts = await firstValueFrom(store.api.searchProducts({ featured: true }));

          if (cancelled) return;

          patchState(store, {
            featuredProducts: featuredProducts.products,
            loading: false,
          });
        })();
      });
    },
  }),

  withMethods(() => ({
    stars(rating: number): boolean[] {
      return Array.from({ length: 5 }, (_, i) => i < Math.floor(rating));
    },
  })),

  withMethods((store) => ({
    onCategoryImageError(categoryId: string) {
      const failed = new Set(store.failedCategoryImages());
      failed.add(categoryId);
      patchState(store, { failedCategoryImages: failed });
    },

    getCategoryImageSource(category: Category): string {
      return store.failedCategoryImages().has(category.id)
        ? PLACEHOLDER_IMAGE_URL
        : category.thumbnail || PLACEHOLDER_IMAGE_URL;
    },

    isCategoryImageFailed(categoryId: string): boolean {
      return store.failedCategoryImages().has(categoryId);
    },
  })),
);
