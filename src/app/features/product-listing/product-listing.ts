import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductsStore } from './state/products.store';

@Component({
    selector: 'app-product-listing',
    standalone: true,
    imports: [CommonModule],
    providers: [ProductsStore],
    templateUrl: './product-listing.html',
})
export class ProductListing {
    readonly store = inject(ProductsStore);

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
    }
}