import { Component, inject, effect } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ProductDetailStore } from './product-details.store';
import { ProductsService } from '../product-listing/services/products.service';
import { CartStore } from '../cart/cart.store';
import { Product } from '../../core/models/product.model';
import { ProductTile } from '../product-listing/components/product-tile';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, ProductTile],
  providers: [ProductDetailStore, ProductsService],
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
