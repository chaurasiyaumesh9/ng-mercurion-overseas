import { Component, inject, effect } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ProductTile } from '@product-listing/ui/product-tile/product-tile';
import { ProductDetailStore } from '@product-details/state/product-details.store';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, ProductTile, RouterLink],
  providers: [ProductDetailStore],
  template: ``
  //templateUrl: './product-details.html',
})
export class ProductDetails {
  readonly store = inject(ProductDetailStore);
  private route = inject(ActivatedRoute);
  readonly router = inject(Router);

  readonly starArray = [0, 1, 2, 3, 4];

  constructor() {
    const productIdSignal = toSignal(this.route.paramMap);
    effect(() => {
      const productId = productIdSignal()?.get('productId');
      if (productId) this.store.loadProduct(productId);
    });
  }

  floor(value: number): number {
    return Math.floor(value);
  }

  calculateSavePercent(product: any): number {
    if (!product?.originalPrice) return 0;
    return Math.round((1 - product.price / product.originalPrice) * 100);
  }

  getGalleryImages(product: any): string[] {
    return [product.image, product.image, product.image, product.image];
  }

  parseQuantityInput(value: string): void {
    this.store.setQuantity(parseInt(value, 10));
  }
}
