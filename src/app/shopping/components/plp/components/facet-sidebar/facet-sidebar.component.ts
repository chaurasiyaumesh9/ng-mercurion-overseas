import { Component, Input, inject } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Facet } from '@shopping/models/facets.model';

@Component({
  selector: 'app-facet-sidebar',
  templateUrl: './facet-sidebar.component.html',
  standalone: true,
})
export class FacetSidebarComponent {
  @Input() facets: Facet[] = [];

  private router = inject(Router);
  private route = inject(ActivatedRoute);

  constructor() {
    console.log(this.facets)
  }

  // Apply facet using SCA-provided URL
  applyFacet(url: string) {
    this.router.navigateByUrl(url);
  }

  // Detect if value is selected (SCA does not always send explicit flag)
  isSelected(facetId: string, valueName: string): boolean {
    const query = this.route.snapshot.queryParams;
    const current = query[facetId];

    if (!current) return false;

    // SCA multi-select: comma-separated
    if (Array.isArray(current)) {
      return current.includes(valueName);
    }

    return String(current).split(',').includes(valueName);
  }

  // Clear single facet
  clearFacet(facetId: string) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { [facetId]: null },
      queryParamsHandling: 'merge',
    });
  }

  // Clear all filters (keep category context)
  clearAll() {
    const category = this.route.snapshot.queryParams['commercecategoryurl'];

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        commercecategoryurl: category,
      },
    });
  }
}
