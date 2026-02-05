import { inject, computed } from '@angular/core';
import { signalStore, withState, withComputed, withMethods, patchState } from '@ngrx/signals';
import { CartService } from './services/cart.services';
import { Product } from '../../core/models/product.model';

export interface CartState {
  cart: any[];
}

export const CartStore = signalStore(
  { providedIn: 'root' },
  withState<CartState>({
    cart: [],
  }),

  withComputed((store) => {
    const subtotal = computed(() => store.cart().reduce((sum, i) => sum + i.price * i.quantity, 0));

    const shipping = computed(() => (subtotal() > 100 ? 0 : 10));

    const tax = computed(() => subtotal() * 0.1);

    const total = computed(() => subtotal() + shipping() + tax());

    const cartCount = computed(() => store.cart().reduce((t, i) => t + i.quantity, 0));

    const crossSellProducts = computed(() => {
      const cartIds = store.cart().map((i) => i.id);

      return [];
    });

    return {
      subtotal,
      shipping,
      tax,
      total,
      crossSellProducts,
      cartCount,
    };
  }),
  withMethods((store) => {
    const cartService = inject(CartService);

    return {
      loadCart() {
        patchState(store, {
          cart: cartService.getCart(),
        });
      },

      removeItem(id: string) {
        cartService.removeFromCart(id);
        this.loadCart();
      },

      updateQty(id: string, qty: number) {
        cartService.updateQuantity(id, qty);
        this.loadCart();
      },

      addItem(product: Product, quantity: number) {
        cartService.addToCart(product, quantity);
        this.loadCart();
      },
    };
  }),
);
