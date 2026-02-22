import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductListingStore } from '@product-listing/state/product-listing.store';
import { ProductTile } from '../product-tile/product-tile';
import { RouterLink } from '@angular/router';


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