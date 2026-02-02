import { Injectable, signal } from '@angular/core';

@Injectable()
export class CartService {
  cart = signal<any[]>([]);

  addToCart(product: any) {
    this.cart.update(items => [...items, product]);
  }
}
