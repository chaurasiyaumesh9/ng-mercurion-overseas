import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { CartStore } from '@shopping/stores/cart.store';
import { Store } from '@ngrx/store';
import { selectCategories } from '@appState/categories/categories.selectors';

@Component({
    selector: 'app-header',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './header.html',
})
export class Header {
    readonly cartStore = inject(CartStore);    
    private router = inject(Router);   
    private store = inject(Store);
    readonly categories$ = this.store.select(selectCategories);    

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
