import { Injectable } from "@angular/core";
import { CartItem } from "../models/cart-item.model";

const STORAGE_KEY = 'app_cart';

@Injectable({ providedIn: 'root' })
export class CartPersistence {
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

  getCart() {
    return this.read();
  }

  saveCart(cart: CartItem[]) {
    this.write(cart);
  }

  clear() {
    this.write([]);
  }
}
