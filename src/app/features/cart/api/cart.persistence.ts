import { Injectable } from "@angular/core";
import { CartItem } from "../models/cart-item.model";

const APP_CART_STORAGE_KEY = 'app_cart';

@Injectable({ providedIn: 'root' })
export class CartPersistence {
  private readFromStorage(): CartItem[] {
    try {
      const raw = localStorage.getItem(APP_CART_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private writeToStorage(cart: CartItem[]): void {
    localStorage.setItem(APP_CART_STORAGE_KEY, JSON.stringify(cart));
  }

  getCart(): CartItem[] {
    return this.readFromStorage();
  }

  saveCart(cart: CartItem[]): void {
    this.writeToStorage(cart);
  }

  clear(): void {
    this.writeToStorage([]);
  }
}
