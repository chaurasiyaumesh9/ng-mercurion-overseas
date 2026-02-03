import { inject } from '@angular/core';
import {
    signalStore,
    withState,
    withComputed,
    withMethods,
    patchState,
} from '@ngrx/signals';
import { ActivatedRoute } from '@angular/router';
import { ProductsService } from '../services/products.service';
import { Product } from '../../../core/models/product.model';
import { toSignal } from '@angular/core/rxjs-interop';
import { computed } from '@angular/core';

export interface ProductsState {
    products: Product[];
    loading: boolean;
}

export const ProductsStore = signalStore(
    withState<ProductsState>({
        products: [],
        loading: false,
    }),

    withComputed(() => {
        const route = inject(ActivatedRoute);

        // Convert route observables to signals
        const routeParams = toSignal(route.paramMap, { initialValue: null });
        const queryParams = toSignal(route.queryParamMap, { initialValue: null });

        // Derive filter values from route as computed signals
        return {
            categorySlug: computed(() => routeParams()?.get('categorySlug') ?? null),
            subCategorySlug: computed(() => routeParams()?.get('subCategorySlug') ?? null),
            search: computed(() => queryParams()?.get('keywords') ?? null),
        };
    }),

    withComputed((store) => ({
        filteredProducts: computed(() => {
            let list = store.products();

            // Use nested properties for filtering
            if (store.categorySlug()) {
                list = list.filter(p => p.category.slug === store.categorySlug());
            }

            if (store.subCategorySlug()) {
                list = list.filter(p => p.subCategory.slug === store.subCategorySlug());
            }

            return list;
        })
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
            return products.length > 0  && store.categorySlug() ? products[0].category : null;
        }),

        currentSubCategory: computed(() => {
            const products = store.filteredProducts();
            return products.length > 0 && store.subCategorySlug() ? products[0].subCategory : null;
        })
    })),

    withMethods((store, service = inject(ProductsService)) => ({
        init() {
            patchState(store, { loading: true });

            service.getProducts().subscribe(products => {
                patchState(store, {
                    products,
                    loading: false
                });
            });
        },
        // Note: clearFilters doesn't make sense anymore since filters come from the route
        // To clear filters, you'd navigate to the base route instead
    }))
);