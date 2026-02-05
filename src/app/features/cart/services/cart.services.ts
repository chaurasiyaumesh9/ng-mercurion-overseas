import { Injectable, signal } from '@angular/core';
import { Product } from '../../../core/models/product.model';

@Injectable()
export class CartService {
  cart = signal<any[]>([]);

  addToCart(product: Product, quantity: number) {
    this.cart.update(items => [...items, { ...product, quantity }]);
  }
}
