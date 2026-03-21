import { signalStore, withState, withMethods, patchState, withComputed } from '@ngrx/signals';
import { computed, inject } from '@angular/core';
import { ItemModel } from '@shopping/models/item.model';
import { Facet } from '@shopping/models/facets.model';
import { ItemsApi } from '@shopping/services/items.api';

const facetLabels: Record<string, string> = {
  categoryIds: 'Categories',
  brand: 'Brand',
  color: 'Color',
  size: 'Size',
  material: 'Material',
  style: 'Style',
  gender: 'Gender',
  custitem_ns_pr_rating: 'Customer Rating',
  custitem9: 'Gender',
  custitem4: 'Color',
  custitem6: 'Size'
};

const hiddenFacetFields = new Set([
  'custitem_deal_products',
  'category',
  'categoryIds',
  'commercecategoryname',
  'custitem_ns_sc_ext_gw_isitem',
  'custitemtop_selling',
  'pricelevel5',
]);

export const PlpStore = signalStore(
  withState({
    items: [] as ItemModel[],
    facets: [] as Facet[],
    total: 0,
    loading: false,
  }),

  withMethods((store) => {
    const api = inject(ItemsApi);

    return {
      load(params: Record<string, any>) {
        patchState(store, { loading: true });

        api.getItems(params).subscribe((res) => {
          patchState(store, {
            items: res.items,
            facets: res.facets,
            total: res.total,
            loading: false,
          });
        });
      },
    };
  }),
  withComputed((store) => {
    const visibleFacets = computed<Facet[]>(() =>
      store
        .facets()
        .filter((f) => !!f.url && !hiddenFacetFields.has(f.url) && f.values.length > 0),
    );

    return {
      visibleFacets,
    };
  }),
);
