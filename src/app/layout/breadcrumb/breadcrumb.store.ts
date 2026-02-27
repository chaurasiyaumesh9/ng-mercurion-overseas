import { inject, computed } from '@angular/core';
import { signalStore, withProps, withComputed } from '@ngrx/signals';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';
import { selectCategories } from '@appState/categories/categories.selectors';
import { Breadcrumb } from './breadcrumb.model';
import { ProductDetailStore } from '@shopping/stores/product-details.store';

export const BreadcrumbStore = signalStore(
  withProps(() => {
    const router = inject(Router);
    const ngrxStore = inject(Store);
    const productStore = inject(ProductDetailStore, { optional: true });

    return {
      router,
      categories: ngrxStore.selectSignal(selectCategories),
      productStore,
    };
  }),

  withComputed((store) => {
    const routerEvents = toSignal(store.router.events, { initialValue: null });

    const breadcrumbs = computed<Breadcrumb[]>(() => {
      routerEvents(); // force recompute on navigation

      const url = store.router.url;

      // Hide on Home
      if (url === '/' || url === '') {
        return [];
      }

      const [pathPart, queryPart] = url.split('?');
      const segments = pathPart.split('/').filter(Boolean);

      const crumbs: Breadcrumb[] = [{ label: 'Home', url: '/' }];

      if (!segments.length) return [];

      // --------------------------------------------------
      // PRODUCT DETAILS PAGE
      // --------------------------------------------------
      if (segments[0] === 'product') {
        const product = store.productStore?.product();

        if (product) {
          crumbs.push({
            label: product.name,
            url: null,
          });
        }

        return crumbs;
      }

      // --------------------------------------------------
      // SEARCH PAGE
      // --------------------------------------------------
      if (segments[0] === 'search') {
        const params = new URLSearchParams(queryPart);
        const keywords = params.get('keywords');

        crumbs.push({
          label: keywords ? `Search: ${keywords}` : 'Search',
          url: null,
        });

        return crumbs;
      }

      // --------------------------------------------------
      // CATEGORY + SUBCATEGORY
      // --------------------------------------------------
      const categories = store.categories();
      const category = categories.find((c) => c.slug === segments[0]);

      if (!category) return [];

      crumbs.push({
        label: category.name,
        url: `/${category.slug}`,
      });

      if (segments.length > 1) {
        const sub = category.subCategories?.find((s) => s.slug === segments[1]);

        if (sub) {
          crumbs.push({
            label: sub.name,
            url: `/${category.slug}/${sub.slug}`,
          });
        }
      }

      return crumbs;
    });

    return { breadcrumbs };
  }),
);
