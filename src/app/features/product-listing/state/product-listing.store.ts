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
import { Category } from '../../../core/models/category.model';
import { Observable } from 'rxjs';

interface ListingRouteData {
    categories: Category[];
}

export interface ProductsState {
    products: Product[];
    loading: boolean;
    currentPage: number;
    sortBy: 'featured' | 'price-low' | 'price-high' | 'rating' | 'name',
    priceRange: [number, number],
    selectedCategories: string[],
    selectedSubCategories: string[],
    mobileFiltersOpen: boolean,
}


export const ProductListingStore = signalStore(
    withState<ProductsState>({
        products: [],
        loading: false,
        currentPage: 1,
        sortBy: 'featured',
        priceRange: [0, 500] as [number, number],
        selectedCategories: [] as string[],
        selectedSubCategories: [] as string[],
        mobileFiltersOpen: false,
    }),

    withComputed(() => {
        const route = inject(ActivatedRoute);

        // Convert route observables to signals
        const routeParams = toSignal(route.paramMap, { initialValue: null });
        const queryParams = toSignal(route.queryParamMap, { initialValue: null });
        const categories = toSignal(route.data as Observable<ListingRouteData>, {
            initialValue: { categories: [] }
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
        filteredProducts: computed(() => {
            let list = store.products();

            // 1. Route-based filters (menu navigation)
            if (store.categorySlug()) {
                list = list.filter(p =>
                    p.category.slug === store.categorySlug()
                );
            }

            if (store.subCategorySlug()) {
                list = list.filter(p =>
                    p.subCategory.slug === store.subCategorySlug()
                );
            }

            // 2. Facet filters (checkboxes)
            if (store.selectedCategories().length > 0) {
                list = list.filter(p =>
                    store.selectedCategories().includes(p.category.slug)
                );
            }

            if (store.selectedSubCategories().length > 0) {
                list = list.filter(p =>
                    store.selectedSubCategories().includes(p.subCategory.slug)
                );
            }

            list = list.filter(
                p => p.price >= store.priceRange()[0] &&
                    p.price <= store.priceRange()[1]
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
            return products.length > 0 && store.categorySlug() ? products[0].category : null;
        }),

        currentSubCategory: computed(() => {
            const products = store.filteredProducts();
            return products.length > 0 && store.subCategorySlug() ? products[0].subCategory : null;
        }),

        totalPages: () => Math.ceil(store.filteredProducts().length / 12),
    })),

    withComputed((store) => ({
        pages: computed(() =>
            Array.from({ length: store.totalPages() }, (_, i) => i + 1)
        )
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
        toggleCategory(category: string) {
            patchState(store, state => ({
                selectedCategories: state.selectedCategories.includes(category)
                    ? state.selectedCategories.filter(c => c !== category)
                    : [...state.selectedCategories, category],
                currentPage: 1
            }));
        },

        toggleSubCategory(sub: string) {
            patchState(store, state => ({
                selectedSubCategories: state.selectedSubCategories.includes(sub)
                    ? state.selectedSubCategories.filter(c => c !== sub)
                    : [...state.selectedSubCategories, sub],
                currentPage: 1
            }));
        },

        clearFilters() {
            patchState(store, {
                selectedCategories: [],
                selectedSubCategories: [],
                priceRange: [0, 500],
                currentPage: 1
            });
        },

        // ---------- pagination ----------
        setPage(page: number) {
            patchState(store, { currentPage: page });
        },

        // ---------- sorting ----------
        setSortBy(sort: ProductsState['sortBy']) {
            patchState(store, {
                sortBy: sort,
                currentPage: 1
            });
        },

        // ---------- price ----------
        setPriceRange(range: [number, number]) {
            patchState(store, {
                priceRange: range,
                currentPage: 1
            });
        },

        // ---------- mobile ----------
        openMobileFilters() {
            patchState(store, { mobileFiltersOpen: true });
        },

        closeMobileFilters() {
            patchState(store, { mobileFiltersOpen: false });
        },
    }))
);