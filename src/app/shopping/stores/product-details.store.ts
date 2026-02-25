import { computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { signalStore, withState, withComputed, withMethods, patchState } from '@ngrx/signals';
import { Product } from '@shopping/models/product.model';
import { CartStore } from '@shopping/stores/cart.store';

export interface ProductDetailState {
  product: Product | null;
  relatedProducts: Product[];
  loading: boolean;
  quantity: number;
  selectedImage: number;
}

export const ProductDetailStore = signalStore(
  withState<ProductDetailState>({
    product: null,
    relatedProducts: [],
    loading: false,
    quantity: 1,
    selectedImage: 0,
  }),

  withComputed((store) => ({
    safeQuantity: computed(() => Math.max(1, store.quantity())),
  })),

  withMethods((store) => {
    const cartStore = inject(CartStore);
    const router = inject(Router);

    return {
      loadProduct(id: string) {
        patchState(store, { loading: true });

        // TODO: API doesn't provide single product endpoint.
        // Implement when endpoint becomes available.
        patchState(store, { loading: false });
      },

      increaseQuantity() {
        patchState(store, { quantity: store.quantity() + 1 });
      },

      decreaseQuantity() {
        patchState(store, { quantity: Math.max(1, store.quantity() - 1) });
      },

      setQuantity(newQuantity: number) {
        patchState(store, { quantity: Math.max(1, newQuantity || 1) });
      },

      selectImage(imageIndex: number) {
        patchState(store, { selectedImage: imageIndex });
      },

      addToCart() {
        const product = store.product();
        if (!product) return;
        cartStore.addItem(product, store.quantity());
      },

      buyNow() {
        const product = store.product();
        if (!product) return;
        cartStore.addItem(product, store.quantity());
        router.navigate(['/cart']);
      },

      addRelatedToCart(product: Product) {
        cartStore.addItem(product, 1);
      },
    };
  }),
);
