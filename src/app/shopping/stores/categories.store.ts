import { inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { Category } from '@shopping/models/category.model';
import { CategoriesApi } from '@shopping/services/categories.api';
import { buildCategoryHierarchy } from '@shopping/mappers/category.mapper';

export interface CategoriesState {
  categories: Category[];
  loading: boolean;
  loaded: boolean;
  error: string | null;
}

const initialState: CategoriesState = {
  categories: [],
  loading: false,
  loaded: false,
  error: null,
};

export const CategoriesStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),

  withMethods((store) => {
    const categoriesApi = inject(CategoriesApi);

    return {
      load() {
        if (store.loaded()) return;

        patchState(store, {
          loading: true,
          error: null
        });

        categoriesApi.getCategories().subscribe({
          next: (dtos) => {
            const categories = buildCategoryHierarchy(dtos);
            patchState(store, {
                categories,
                loading: false,
                loaded: true
            });
          },
          error: () => {
            patchState(store, {
              loading: false,
              error: 'Failed to load categories'
            });
          }
        });
      },

      getBySlug(slug: string) {
        return store.categories().find(c => c.slug === slug);
      }
    };
  })
);