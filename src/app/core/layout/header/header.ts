import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { Category } from '../../models/category.model';
import { Icon } from '../../icons/icon';

@Component({
    selector: 'app-header',
    standalone: true,
    imports: [CommonModule, RouterLink, Icon],
    templateUrl: './header.html',
})
export class Header {
    private router = inject(Router);
    private route = inject(ActivatedRoute);

    categories = signal<Category[]>(this.route.snapshot.data['categories'] || []);

    mobileMenuOpen = signal(false);
    searchQuery = signal('');

    handleSearch(event: Event) {
        event.preventDefault();
        const q = this.searchQuery().trim();
        if (!q) return;

        this.router.navigate(['/search'], {
            queryParams: { keywords: q }
        });

        this.searchQuery.set('');
        this.mobileMenuOpen.set(false);
    }

    closeMobile() {
        this.mobileMenuOpen.set(false);
    }
}
