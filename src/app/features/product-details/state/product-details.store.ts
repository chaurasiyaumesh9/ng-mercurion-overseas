import { computed, inject } from '@angular/core';
import { CartStore } from '@cart/state/cart.store';
import { signalStore, withState, withComputed, withMethods, patchState } from '@ngrx/signals';
import { ProductsApi } from '@product-listing/api/products.api';

import { Product } from '@product//models/product.model';

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
    const productsService = inject(ProductsApi);
    const cartStore = inject(CartStore);

    return {
      loadProduct(id: string) {
        patchState(store, { loading: true });

        productsService.getProduct(id).subscribe((product) => {
          patchState(store, { product, loading: false });

          // Load related (simple strategy using full list)
          productsService.getProducts().subscribe((all) => {
            const related = all
              .filter((p) => p.category.name === product.category.name && p.id !== product.id)
              .slice(0, 4);

            patchState(store, { relatedProducts: related });
          });
        });
      },

      increaseQty() {
        patchState(store, { quantity: store.quantity() + 1 });
      },

      decreaseQty() {
        patchState(store, { quantity: Math.max(1, store.quantity() - 1) });
      },

      setQty(v: number) {
        patchState(store, { quantity: Math.max(1, v || 1) });
      },

      selectImage(i: number) {
        patchState(store, { selectedImage: i });
      },

      addToCart() {
        const p = store.product();
        if (!p) return;
        cartStore.addItem(p, store.quantity());
      },

      buyNow(router: any) {
        const p = store.product();
        if (!p) return;
        cartStore.addItem(p, store.quantity());
        router.navigate(['/cart']);
      },

      addRelatedToCart(product: Product) {
        cartStore.addItem(product, 1);
      },
    };
  }),
);
