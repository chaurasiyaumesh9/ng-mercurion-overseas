import { inject, computed } from '@angular/core';
import { signalStore, withProps, withComputed } from '@ngrx/signals';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';
import { selectCategories } from '@appState/categories/categories.selectors';
import { Breadcrumb } from './breadcrumb.model';
import { ProductsApi } from '@shopping/services/products.api';
import { PRODUCT_URL_COMPONENT_SEGMENT_REGEX } from '@core/constants/route.constants';
import { findBestCategoryPath } from '@shopping/utils/category-route.utils';

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
      if (segments.length === 1 && PRODUCT_URL_COMPONENT_SEGMENT_REGEX.test(segments[0])) {
        const urlcomponent = segments[0];
        const productName = store.productsApi.productNameByUrlComponent()[urlcomponent];
        const productPath = store.productsApi.productBreadcrumbByUrlComponent()[urlcomponent] ?? [];

        for (const pathNode of productPath) {
          crumbs.push({
            label: pathNode.label,
            url: pathNode.url,
          });
        }

        crumbs.push({
          label: productName ?? urlcomponent,
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

      const categories = store.categories();
      const matchedCategoryPath = findBestCategoryPath(
        categories,
        segments.map((segment) => segment.toLowerCase()),
      );

      if (!matchedCategoryPath.length) return [];

      for (const category of matchedCategoryPath) {
        crumbs.push({
          label: category.name,
          url: category.fullurl,
        });
      }

      return crumbs;
    });
    return { breadcrumbs };
  }),
);



