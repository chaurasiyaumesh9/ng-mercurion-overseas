import { Component, Input, computed, inject } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'facet-pagination',
  templateUrl: './facet-pagination.component.html',
  standalone: true,
})
export class FacetPaginationComponent {
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  @Input() total = 0;
  @Input() limit = 24; // must match PLP query default

  // current offset from URL
  private get offset(): number {
    const query = this.route.snapshot.queryParams;
    return Number(query['offset'] ?? 0);
  }

  // derived values
  readonly currentPage = computed(() => {
    return Math.floor(this.offset / this.limit) + 1;
  });

  readonly totalPages = computed(() => {
    return Math.ceil(this.total / this.limit);
  });

  readonly pages = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();

    // windowed pagination (like SCA)
    const windowSize = 5;

    let start = Math.max(1, current - 2);
    let end = Math.min(total, start + windowSize - 1);

    // adjust start if near end
    if (end - start < windowSize) {
      start = Math.max(1, end - windowSize + 1);
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  });

  // navigation
  goToPage(page: number) {
    const offset = (page - 1) * this.limit;

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { offset },
      queryParamsHandling: 'merge',
    });
  }

  next() {
    if (this.currentPage() < this.totalPages()) {
      this.goToPage(this.currentPage() + 1);
    }
  }

  prev() {
    if (this.currentPage() > 1) {
      this.goToPage(this.currentPage() - 1);
    }
  }
}
