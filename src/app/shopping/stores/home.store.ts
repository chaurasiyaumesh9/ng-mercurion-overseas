import { inject, effect } from '@angular/core';
import { selectCategoriesFeatured } from '@appState/categories/categories.selectors';
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
  featuredCategories: Category[];
  featuredProducts: Product[];
  loading: boolean;
  failedCategoryImages: Set<string>;
}

export const HomeStore = signalStore(
  withState<HomeState>(() => ({
    featuredCategories: [],
    featuredProducts: [],
    loading: false,
    failedCategoryImages: new Set<string>(),
  })),

  withProps(() => ({
    ngrxStore: inject(Store),
    api: inject(ProductsApi),
  })),

  withHooks({
    onInit(store) {
      effect((onCleanup) => {
        let cancelled = false;
        onCleanup(() => (cancelled = true));

        (async () => {
          patchState(store, { loading: true });

          const featuredProducts = await firstValueFrom(store.api.searchProducts({ featured: true }));
          
          const featuredCategories = store.ngrxStore.selectSignal(selectCategoriesFeatured);

          if (cancelled) return;

          patchState(store, {
            featuredProducts: featuredProducts.products,
            featuredCategories: featuredCategories(),
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

  withComputed((store) => ({
    featuredCategories: store.featuredCategories,
    featuredProducts: store.featuredProducts,
    loading: store.loading,
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
