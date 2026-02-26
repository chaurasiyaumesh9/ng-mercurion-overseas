import { computed, effect, inject } from '@angular/core';
import {
  signalStore,
  withState,
  withComputed,
  withMethods,
  withHooks,
  withProps,
  patchState,
} from '@ngrx/signals';
import { ActivatedRoute, Router } from '@angular/router';

import { Product } from '@shopping/models/product.model';
import { CartStore } from '@shopping/stores/cart.store';
import { ProductsApi } from '@shopping/services/products.api';
import { firstValueFrom } from 'rxjs/internal/firstValueFrom';
import { toSignal } from '@angular/core/rxjs-interop';

export interface ProductDetailState {
  product: Product | null;
  relatedProducts: Product[];
  loading: boolean;
  quantity: number;
  selectedImage: number;
}

export const ProductDetailStore = signalStore(
  // ----------------------------------
  // STATE
  // ----------------------------------
  withState<ProductDetailState>({
    product: null,
    relatedProducts: [],
    loading: false,
    quantity: 1,
    selectedImage: 0,
  }),

  // ----------------------------------
  // PROPS (Dependency Injection)
  // ----------------------------------
  withProps(() => {
    const route = inject(ActivatedRoute);
    const router = inject(Router);
    const productsApi = inject(ProductsApi);
    const cartStore = inject(CartStore);

    return { route, router, productsApi, cartStore };
  }),

  // ----------------------------------
  // COMPUTED
  // ----------------------------------
  withComputed((store) => {
    const paramMap = toSignal(store.route.paramMap, { initialValue: null });

    const sku = computed(() => paramMap()?.get('sku'));

    const safeQuantity = computed(() => Math.max(1, store.quantity()));

    const savePercent = computed(() => {
      const p = store.product();
      if (!p?.price) return 0;
      return Math.round((1 - p.price / p.price) * 100);
    });

    const galleryImages = computed(() => {
      const p = store.product();
      if (!p?.image) return [];
      return [p.image, p.image, p.image, p.image];
    });

    return { sku, safeQuantity, savePercent, galleryImages };
  }),

  // ----------------------------------
  // METHODS
  // ----------------------------------
  withMethods((store) => {
    async function loadProduct() {
      const sku = store.sku();
      if (!sku) return;

      patchState(store, { loading: true });

      try {
        const result = await firstValueFrom(store.productsApi.searchProducts({ sku }));

        const product = result?.products?.[0] ?? null;

        patchState(store, {
          product,
          relatedProducts: [], // can enhance later
          loading: false,
          quantity: 1,
          selectedImage: 0,
        });
      } catch (err) {
        console.error('Failed to load product', err);
        patchState(store, { loading: false });
      }
    }

    return {
      loadProduct,

      parseQuantityInput(value: string) {
        const parsed = parseInt(value, 10);
        patchState(store, {
          quantity: Math.max(1, parsed || 1),
        });
      },

      increaseQuantity() {
        patchState(store, { quantity: store.quantity() + 1 });
      },

      decreaseQuantity() {
        patchState(store, {
          quantity: Math.max(1, store.quantity() - 1),
        });
      },

      setQuantity(newQuantity: number) {
        patchState(store, {
          quantity: Math.max(1, newQuantity || 1),
        });
      },

      selectImage(index: number) {
        patchState(store, { selectedImage: index });
      },

      addToCart() {
        const product = store.product();
        if (!product) return;
        store.cartStore.addItem(product, store.quantity());
      },

      buyNow() {
        const product = store.product();
        if (!product) return;

        store.cartStore.addItem(product, store.quantity());
        store.router.navigate(['/cart']);
      },

      addRelatedToCart(product: Product) {
        store.cartStore.addItem(product, 1);
      },
    };
  }),

  // ----------------------------------
  // HOOKS
  // ----------------------------------
  withHooks({
    onInit(store) {
      effect(() => {
        store.loadProduct();
      });
    },
  }),
);
