import { Component, inject, effect } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Product } from '@product//models/product.model';
import { ProductTile } from '@product-listing/ui/product-tile/product-tile';
import { ProductDetailStore } from '@product-details/state/product-details.store';
import { ProductsApi } from '@product-listing/api/products.api';
import { CartStore } from '@cart/state/cart.store';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, ProductTile],
  providers: [ProductDetailStore, ProductsApi],
  templateUrl: './product-details.html',
})
export class ProductDetails {
  readonly store = inject(ProductDetailStore);
  readonly cartStore = inject(CartStore);
  route = inject(ActivatedRoute);
  router = inject(Router);

  starArray = [0, 1, 2, 3, 4];

  constructor() {
    effect(() => {
      const id = this.route.snapshot.paramMap.get('productId');
      if (id) this.store.loadProduct(id);
    });
  }

  floor(v: number) {
    return Math.floor(v);
  }

  savePercent(p: any) {
    if (!p?.originalPrice) return 0;
    return Math.round((1 - p.price / p.originalPrice) * 100);
  }

  galleryImages(product: any) {
    return [product.image, product.image, product.image, product.image];
  }

  onQtyInput(v: string) {
    this.store.setQty(parseInt(v, 10));
  }

  addToCart(product: Product) {
    this.cartStore.addItem(product, +this.store.quantity());
  }
}
