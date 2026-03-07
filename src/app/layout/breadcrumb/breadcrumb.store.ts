import { inject, computed } from '@angular/core';
import { signalStore, withProps, withComputed } from '@ngrx/signals';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';
import { selectCategories } from '@appState/categories/categories.selectors';
import { Breadcrumb } from './breadcrumb.model';
import { ProductsApi } from '@shopping/services/products.api';
import { SKU_SEGMENT_REGEX } from '@core/constants/route.constants';

export const BreadcrumbStore = signalStore(
  withProps(() => {
    const router = inject(Router);
    const ngrxStore = inject(Store);
    const productsApi = inject(ProductsApi);
    const routerEvents = toSignal(router.events, { initialValue: null });

    return {
      router,
      productsApi,
      routerEvents,
      categories: ngrxStore.selectSignal(selectCategories),
    };
  }),

  withComputed((store) => {
    const breadcrumbs = computed<Breadcrumb[]>(() => {
      store.routerEvents(); // force recompute on navigation

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
      if (segments.length === 1 && SKU_SEGMENT_REGEX.test(segments[0])) {
        const sku = segments[0];
        const productName = store.productsApi.productNameBySku()[sku];
        crumbs.push({
          label: productName ?? sku,
          url: null,
        });
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

