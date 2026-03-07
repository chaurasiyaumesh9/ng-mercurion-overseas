import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProductTile } from '../product-tile/product-tile';
import { ProductListingStore } from '@shopping/stores/product-listing.store';
import { LucideAngularModule, ChevronLeftIcon, ChevronRightIcon} from 'lucide-angular';

@Component({
  selector: 'app-product-listing',
  standalone: true,
  imports: [LucideAngularModule, CommonModule, ProductTile, RouterLink],
  providers: [ProductListingStore],
  templateUrl: './product-listing.html',
})
export class ProductListing {
    readonly store = inject(ProductListingStore);
    readonly ChevronLeftIcon = ChevronLeftIcon;
    readonly ChevronRightIcon = ChevronRightIcon;
}
