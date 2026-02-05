import { inject, computed } from '@angular/core';
import { signalStore, withState, withComputed, withMethods, patchState } from '@ngrx/signals';
import { CartItem } from '../models/cart-item.model';
import { Product } from '@product//models/product.model';
import { CartPersistence } from '../api/cart.persistence';
import { CartApi } from '../api/cart.api';

export interface CartState {
  cart: CartItem[];
  crossSellProducts: Product[];
}

export const CartStore = signalStore(
  { providedIn: 'root' },

  withState<CartState>({
    cart: [],
    crossSellProducts: [],
  }),

  // -------------------------
  // COMPUTED
  // -------------------------

  withComputed((store) => {
    const subtotal = computed(() => store.cart().reduce((sum, i) => sum + i.price * i.quantity, 0));

    const shipping = computed(() => (subtotal() > 100 ? 0 : 10));

    const tax = computed(() => subtotal() * 0.1);

    const total = computed(() => subtotal() + shipping() + tax());

    const cartCount = computed(() => store.cart().reduce((t, i) => t + i.quantity, 0));

    return {
      subtotal,
      shipping,
      tax,
      total,
      cartCount,
    };
  }),

  // -------------------------
  // METHODS
  // -------------------------

  withMethods((store) => {
    const persistence = inject(CartPersistence);
    const api = inject(CartApi);

    return {
      // -------------------------
      // LOAD
      // -------------------------

      loadCart() {
        patchState(store, {
          cart: persistence.getCart(),
        });
      },

      // -------------------------
      // MUTATIONS (NOW OWNED BY STORE)
      // -------------------------

      addItem(product: Product, quantity = 1) {
        const cart = [...store.cart()];

        const existing = cart.find((i) => i.id === product.id);

        if (existing) {
          existing.quantity += quantity;
        } else {
          cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            category: product.category.name,
            quantity,
          });
        }

        persistence.saveCart(cart);
        patchState(store, { cart });
      },

      removeItem(id: string) {
        const cart = store.cart().filter((i) => i.id !== id);

        persistence.saveCart(cart);
        patchState(store, { cart });
      },

      updateQty(id: string, qty: number) {
        let cart = [...store.cart()];

        const item = cart.find((i) => i.id === id);
        if (!item) return;

        if (qty <= 0) {
          cart = cart.filter((i) => i.id !== id);
        } else {
          item.quantity = qty;
        }

        persistence.saveCart(cart);
        patchState(store, { cart });
      },

      // -------------------------
      // CROSS SELL (REMOTE DATA)
      // -------------------------

      loadCrossSell() {
        api.getCrossSellProducts().subscribe((products) => {
          const cartIds = store.cart().map((i) => i.id);

          patchState(store, {
            crossSellProducts: products.filter((p) => !cartIds.includes(p.id)),
          });
        });
      },
    };
  }),
);
