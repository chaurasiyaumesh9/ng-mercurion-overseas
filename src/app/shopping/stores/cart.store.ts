import { inject, computed } from '@angular/core';
import { signalStore, withState, withComputed, withMethods, patchState } from '@ngrx/signals';
import { createEmptyCart } from '@shopping/models/cart.empty.model';
import { Product } from '@shopping/models/product.model';
import { LiveOrderModel } from '@shopping/models/liveorder.model';
import { Option, PayloadLiveOrderLine } from '@shopping/models/payloads/payload.liveorder.line.model';
import { CartApi } from '@shopping/services/cart.api';
import { firstValueFrom } from 'rxjs';

export interface CartState {
  cart: LiveOrderModel;
  crossSellProducts: Product[];
}

export const CartStore = signalStore(
  { providedIn: 'root' },
  withState<CartState>({
    cart: createEmptyCart(),
    crossSellProducts: [],
  }),

  withComputed((store) => {
    const subtotal = computed(() => store.cart().lines.reduce((sum, i) => sum + (i.total ?? i.rate * i.quantity), 0));

    const shipping = computed(() => (subtotal() > 100 ? 0 : 10));

    const tax = computed(() => subtotal() * 0.1);

    const total = computed(() => subtotal() + shipping() + tax());

    const cartCount = computed(() => store.cart().lines.reduce((total, line) => total + (line.quantity || 0), 0));

    return {
      subtotal,
      shipping,
      tax,
      total,
      cartCount,
    };
  }),

  withMethods((store) => {
    const api = inject(CartApi);
    let loadCartInFlight: Promise<void> | null = null;
    const normalizeInternalId = (value: string): number | string => {
      const numeric = Number(value);
      return Number.isInteger(numeric) ? numeric : value;
    };
    const resolveOptionsFromCart = (productId: string): Option[] => {
      const fromSameProduct = store.cart().lines.find((line) => `${line.item?.internalid ?? ''}` === productId)?.options;
      if (fromSameProduct?.length) return fromSameProduct as Option[];
      const fromAnyLine = store.cart().lines.find((line) => (line.options ?? []).length > 0)?.options;
      return (fromAnyLine as Option[]) ?? [];
    };
    const buildAddPayload = (product: Product, quantity: number): PayloadLiveOrderLine[] => [
      {
        item: {
          internalid: normalizeInternalId(product.id),
          type: 'InvtPart',
        },
        quantity,
        options: resolveOptionsFromCart(product.id),
        location: '',
        fulfillmentChoice: 'ship',
        freeGift: false,
      },
    ];
    const buildUpdatePayload = (lineId: string, itemId: string, quantity: number): PayloadLiveOrderLine => ({
      item: {
        internalid: normalizeInternalId(itemId),
        type: 'InvtPart',
      },
      quantity,
      internalid: lineId,
      options: [],
      location: '',
      fulfillmentChoice: 'ship',
      freeGift: false,
    });
    const hydrateCart = async () => {
      const cart = await firstValueFrom(api.getCart());
      patchState(store, { cart: cart ?? createEmptyCart() });
    };

    return {
      async loadCart() {
        if (loadCartInFlight) {
          await loadCartInFlight;
          return;
        }

        loadCartInFlight = (async () => {
          await hydrateCart();
        })();

        try {
          await loadCartInFlight;
        } finally {
          loadCartInFlight = null;
        }
      },

      async addItem(product: Product, quantity = 1) {
        const previousCart = store.cart();
        const existingItem = store.cart().lines.find((item) => `${item.item?.internalid ?? ''}` === product.id);

        try {
          if (existingItem?.internalid) {
            await firstValueFrom(
              api.updateQuantity(
                existingItem.internalid,
                buildUpdatePayload(existingItem.internalid, `${existingItem.item?.internalid ?? product.id}`, existingItem.quantity + quantity),
              ),
            );
          } else {
            await firstValueFrom(api.addItem(buildAddPayload(product, quantity)));
          }
          await hydrateCart();
        } catch (error) {
          console.error('Failed to add item to LiveOrder.Service.ss', error);
          patchState(store, { cart: previousCart });
        }
      },

      async removeItem(id: string) {
        const previousCart = store.cart();
        const targetItem = store.cart().lines.find((item) => item.internalid === id);

        try {
          if (!targetItem?.internalid) {
            throw new Error('Missing line internalid for removal.');
          }
          await firstValueFrom(api.removeItem(targetItem.internalid));
          await hydrateCart();
        } catch (error) {
          console.error('Failed to remove item from LiveOrder.Service.ss', error);
          patchState(store, { cart: previousCart });
        }
      },

      async updateQuantity(id: string, newQuantity: number) {
        const previousCart = store.cart();
        const item = store.cart().lines.find((cartItem) => cartItem.internalid === id);
        if (!item) return;

        try {
          if (newQuantity <= 0) {
            if (!item.internalid) {
              throw new Error('Missing line internalid for quantity update removal.');
            }
            await firstValueFrom(api.removeItem(item.internalid));
          } else {
            if (!item.internalid) {
              throw new Error('Missing line internalid for quantity update.');
            }
            await firstValueFrom(
              api.updateQuantity(item.internalid, buildUpdatePayload(item.internalid, `${item.item?.internalid ?? ''}`, newQuantity)),
            );
          }
          await hydrateCart();
        } catch (error) {
          console.error('Failed to update item quantity in LiveOrder.Service.ss', error);
          patchState(store, { cart: previousCart });
        }
      },

      async clearCart() {
        const previousCart = store.cart();
        patchState(store, { cart: createEmptyCart() });

        try {
          await firstValueFrom(api.clearCart());
          await hydrateCart();
        } catch (error) {
          console.error('Failed to clear cart in LiveOrder.Service.ss', error);
          patchState(store, { cart: previousCart });
        }
      },

      loadCrossSell() {
        api.getCrossSellProducts().subscribe((products) => {
          const cartIds = store.cart().lines.map((item) => `${item.item?.internalid ?? ''}`).filter(Boolean);

          patchState(store, {
            crossSellProducts: products.filter((product) => !cartIds.includes(product.id)),
          });
        });
      },
    };
  }),
);
