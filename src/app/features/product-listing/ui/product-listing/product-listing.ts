import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductListingStore } from '@product-listing/state/product-listing.store';
import { ProductTile } from '../product-tile/product-tile';


@Component({
    selector: 'app-product-listing',
    standalone: true,
    imports: [CommonModule, ProductTile],
    providers: [ProductListingStore],
    templateUrl: './product-listing.html',
})
export class ProductListing {
    readonly store = inject(ProductListingStore);

    // Signals from store
    products = this.store.filteredProducts;
    loading = this.store.loading;
    
    // Display names (derived from products)
    categoryName = this.store.categoryName;
    subCategoryName = this.store.subCategoryName;
    
    // Search term
    search = this.store.search;

    constructor() {
        this.store.init();
        this.store.resetFacetUIState();
    }
}