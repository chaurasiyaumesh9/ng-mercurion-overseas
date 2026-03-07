import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductTile } from '../product-tile/product-tile';
import { ProductDetailStore } from '@shopping/stores/product-details.store';
import { LucideAngularModule, TruckIcon, RotateCcwIcon, ShieldCheckIcon} from 'lucide-angular';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [LucideAngularModule, CommonModule, ProductTile],
  providers: [ProductDetailStore],
  templateUrl: './product-details.html',
})
export class ProductDetails {
  readonly store = inject(ProductDetailStore);   
  readonly TruckIcon = TruckIcon;
    readonly RotateCcwIcon = RotateCcwIcon;
    readonly ShieldCheckIcon = ShieldCheckIcon;
}
