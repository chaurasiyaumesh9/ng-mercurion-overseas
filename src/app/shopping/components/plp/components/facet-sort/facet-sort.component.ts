import { Component, computed, inject } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'facet-sort',
  templateUrl: './facet-sort.component.html',
  standalone: true,
})
export class FacetSortComponent {
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // SCA sort options
  readonly sortOptions = [
    { label: 'Relevance', value: 'commercecategory:desc' },
    { label: 'Price Low to High', value: 'price:asc' },
    { label: 'Price High to Low', value: 'price:desc' },
    { label: 'Name A-Z', value: 'name:asc' },
    { label: 'Name Z-A', value: 'name:desc' },
  ];

  // current sort (derived from URL)
  readonly currentSort = computed(() => {
    const query = this.route.snapshot.queryParams;
    return query['sort'] || 'commercecategory:desc';
  });

  // update sort
  updateSort(sort: string) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        sort,
        offset: 0, // reset pagination (IMPORTANT)
      },
      queryParamsHandling: 'merge',
    });
  }
}
