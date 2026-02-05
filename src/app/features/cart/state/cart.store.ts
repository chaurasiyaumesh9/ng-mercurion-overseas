import { inject, computed } from '@angular/core';
import { signalStore, withState, withComputed, withMethods, patchState } from '@ngrx/signals';
import { CartService } from '../services/cart.api';
import { Product } from '@product//models/product.model';

export interface CartState {
  cart: any[];
  crossSellProducts: Product[];
}

export const CartStore = signalStore(
  { providedIn: 'root' },
  withState<CartState>({
    cart: [],
    crossSellProducts: [],
  }),

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

      loadCrossSell() {
        cartService.getCrossSellProducts().subscribe((products) => {
          const cartIds = store.cart().map((i) => i.id);

          patchState(store, {
            crossSellProducts: products.filter((p) => !cartIds.includes(p.id)),
          });
        });
      },
    };
  }),
);
