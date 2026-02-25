import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductTile } from '../product-tile/product-tile';
import { RouterLink } from '@angular/router';
import { ProductListingStore } from '@shopping/stores/product-listing.store';

@Component({
    selector: 'app-product-listing',
    standalone: true,
    imports: [CommonModule, ProductTile, RouterLink],
    providers: [ProductListingStore],
    templateUrl: './product-listing.html',
})
export class ProductListing {
    readonly store = inject(ProductListingStore);
}