import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { CartStore } from '@shopping/stores/cart.store';
import { Store } from '@ngrx/store';
import { selectCategories, selectCategoriesLoaded } from '@appState/categories/categories.selectors';
import { LucideAngularModule, SearchIcon, UserIcon, ShoppingBag, MenuIcon, ChevronDown } from 'lucide-angular';
import { Category } from '@shopping/models/category.model';

@Component({
    selector: 'app-header',
    standalone: true,
    imports: [LucideAngularModule, CommonModule, RouterLink],
    templateUrl: './header.html',
})
export class Header {
    readonly cartStore = inject(CartStore);    
    private router = inject(Router);   
    private store = inject(Store);
    readonly categories$ = this.store.select(selectCategories);
    readonly categoriesLoaded$ = this.store.select(selectCategoriesLoaded);
    readonly SearchIcon = SearchIcon;
    readonly UserIcon = UserIcon;
    readonly ShoppingBag = ShoppingBag;
    readonly MenuIcon = MenuIcon;
    readonly ChevronDown = ChevronDown;

    mobileMenuOpen = signal(false);
    searchOpen = signal(false);
    searchQuery = signal('');
    activeMenu = signal<string | null>(null);

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

    openSearch() {
        this.searchOpen.set(true);
    }

    closeSearch() {
        this.searchOpen.set(false);
    }

    setActiveMenu(categoryId: string, hasMegaMenu: boolean) {
        this.activeMenu.set(hasMegaMenu ? categoryId : null);
    }

    clearActiveMenu() {
        this.activeMenu.set(null);
    }

    getActiveCategory(categories: Category[] | null | undefined): Category | null {
        const activeId = this.activeMenu();
        if (!activeId || !categories?.length) return null;

        return categories.find((category) => category.internalid === activeId) ?? null;
    }
}
