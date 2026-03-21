import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { buildPlpParams } from '@shopping/mappers/plp-query.util';
import { PlpStore } from '@shopping/stores/plp.store';
import { FacetSidebarComponent } from './components/facet-sidebar/facet-sidebar.component';
import { FacetSortComponent } from './components/facet-sort/facet-sort.component';
import { FacetPaginationComponent } from './components/facet-pagination/facet-pagination.component';
import { FacetItemComponent } from './components/facet-item/facet-item.component';

@Component({
  selector: 'app-plp',
  templateUrl: './plp.component.html',
  standalone: true,
  imports: [
    FacetSidebarComponent,
    FacetSortComponent,
    FacetPaginationComponent,
    FacetItemComponent,
  ],
  providers: [PlpStore],
})
export class PlpComponent {
  // injections
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private store = inject(PlpStore);

  // expose signals to template
  readonly items = this.store.items;
  readonly facets = this.store.visibleFacets;
  readonly total = this.store.total;
  readonly loading = this.store.loading;

  constructor() {
    // Router-driven state (SCA style)
    this.route.queryParams.subscribe((query) => {
      const categoryPath = this.getCategoryPath();

      const params = buildPlpParams({
        ...query,
        commercecategoryurl: categoryPath,
      });

      this.store.load(params);
    });   
  }

  private getCategoryPath(): string {
    const url = this.router.url.split('?')[0];
    return decodeURIComponent(url);
  }
}
