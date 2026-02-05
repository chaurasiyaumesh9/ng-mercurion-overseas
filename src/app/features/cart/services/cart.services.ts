import { Injectable } from '@angular/core';
import { CartItem } from '../model/cart-item.model';

const STORAGE_KEY = 'app_cart';

@Injectable({providedIn: 'root'})
export class CartService {
  // -------------------------
  // STORAGE HELPERS
  // -------------------------

  private read(): CartItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private write(cart: CartItem[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  }

  // -------------------------
  // PUBLIC API
  // -------------------------

  getCart(): CartItem[] {
    return this.read();
  }

  clearCart() {
    this.write([]);
  }

  // -------------------------
  // ADD
  // -------------------------

  addToCart(product: any, quantity = 1) {
    const cart = this.read();

    const existing = cart.find((i) => i.id === product.id);

    if (existing) {
      existing.quantity += quantity;
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        category: product.category,
        quantity,
      });
    }

    this.write(cart);
  }

  // -------------------------
  // REMOVE
  // -------------------------

  removeFromCart(id: string) {
    const cart = this.read().filter((i) => i.id !== id);
    this.write(cart);
  }

  // -------------------------
  // UPDATE QUANTITY
  // -------------------------

  updateQuantity(id: string, quantity: number) {
    const cart = this.read();

    const item = cart.find((i) => i.id === id);

    if (!item) return;

    if (quantity <= 0) {
      this.removeFromCart(id);
      return;
    }

    item.quantity = quantity;
    this.write(cart);
  }

  // -------------------------
  // TOTALS (OPTIONAL)
  // -------------------------

  getCartTotal(): number {
    return this.read().reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  getCartCount(): number {
    return this.read().reduce((sum, item) => sum + item.quantity, 0);
  }
}
