import { Component, computed, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { ProductTile } from '../product-tile/product-tile';
import { ProductListingStore } from '@shopping/stores/product-listing.store';
import * as PRODUCT_ACTION from '@shopping/state/product-listing/product-listing.actions';
import * as PRODUCT_SELECTORS from '@shopping/state/product-listing/product-listing.selectors';
import * as CATEGORY_SELECTORS from '@appState/categories/categories.selectors';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-product-listing',
  standalone: true,
  imports: [CommonModule, ProductTile, RouterLink],
  providers: [ProductListingStore], // UI-only store
  templateUrl: './product-listing.html',
})
export class ProductListing {
    private store = inject(Store);
    private route = inject(ActivatedRoute);
    readonly plpSignalstore = inject(ProductListingStore);

    products = this.store.selectSignal(PRODUCT_SELECTORS.selectProducts);
    loading = this.store.selectSignal(PRODUCT_SELECTORS.selectLoading);
    total = this.store.selectSignal(PRODUCT_SELECTORS.selectTotal);
    page = this.store.selectSignal(PRODUCT_SELECTORS.selectPage);
    pageSize = this.store.selectSignal(PRODUCT_SELECTORS.selectPageSize);
    totalPages = this.store.selectSignal(PRODUCT_SELECTORS.selectTotalPages);
    visibleFacets = this.store.selectSignal(PRODUCT_SELECTORS.selectVisibleFacets);
    categories = this.store.selectSignal(CATEGORY_SELECTORS.selectCategories);

    // ========================
    // URL → Signals
    // ========================

    private paramMap = toSignal(this.route.paramMap, { initialValue: null });
    private queryMap = toSignal(this.route.queryParamMap, { initialValue: null });

    search = computed(() =>
        this.queryMap()?.get('keywords') ?? undefined
    );

    categorySlug = computed(() =>
        this.paramMap()?.get('categorySlug')
    );

    subCategorySlug = computed(() =>
        this.paramMap()?.get('subCategorySlug')
    );

    pageFromUrl = computed(() =>
        Number(this.queryMap()?.get('page') ?? 1)
    );

    pageSizeFromUrl = computed(() =>
        Number(this.queryMap()?.get('pageSize') ?? 12)
    );

    facetsFromUrl = computed(() => {
        const params = this.queryMap();
        const map = new Map<string, Set<string>>();

        if (!params) return map;

        params.keys.forEach(key => {
            if (!['keywords', 'page', 'pageSize'].includes(key)) {
            const value = params.get(key);
            if (value) {
                const set = new Set<string>();
                value.split(',').forEach(v => {
                if (v) set.add(v);
                });
                map.set(key, set);
            }
            }
        });

        return map;
    });

    // ========================
    // Category ID Resolution
    // ========================

    currentCategoryId = computed(() => {
        const slug = this.categorySlug();
        const subSlug = this.subCategorySlug();
        const categories = this.categories();

        if (!slug) return undefined;

        const category = categories.find(c => c.slug === slug);
        if (!category) return undefined;

        if (subSlug) {
        const sub = category.subCategories?.find(s => s.slug === subSlug);
        return sub?.id;
        }

        return category.id;
    });

    visiblePageNumbers = computed(() => {
        const current = this.page();
        const total = this.totalPages();

        const start = Math.max(1, current - 2);
        const end = Math.min(total, current + 2);

        const pages: number[] = [];
        for (let i = start; i <= end; i++) {
            pages.push(i);
        }

        return pages;
    });

    constructor() {
        effect(() => {
            this.loadProducts();
        });
    }

    loadProducts(): void{
        this.store.dispatch(
                PRODUCT_ACTION.loadProducts({
                    search: this.search(),
                    categoryId: this.currentCategoryId(),
                    page: this.pageFromUrl(),
                    pageSize: this.pageSizeFromUrl(),
                    facets: this.facetsFromUrl(),
             }),
        );
    }
}
