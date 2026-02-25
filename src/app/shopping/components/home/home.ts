import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ProductTile } from '../product-tile/product-tile';
import { Category } from '@shopping/models/category.model';
import { Product } from '@shopping/models/product.model';

const PLACEHOLDER_IMAGE_URL = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><rect fill="%23E5E7EB" width="400" height="400"/><g transform="translate(100, 100)"><rect x="0" y="0" width="200" height="200" fill="%23D1D5DB"/><circle cx="50" cy="50" r="30" fill="%239CA3AF"/><path d="M0 200 L60 120 L120 150 L200 80 L200 200 Z" fill="%239CA3AF"/></g></svg>';

@Component({
  standalone: true,
  selector: 'app-home-page',
  imports: [CommonModule, RouterModule, ProductTile],
  templateUrl: './home.html',
})
export class Home {

  private route = inject(ActivatedRoute);
  failedCategoryImages = signal<Set<string>>(new Set());

  categories = signal<Category[]>(
    this.route.snapshot.data['categories'] ?? []
  );

  featuredProducts = signal<Product[]>(
    this.route.snapshot.data['featuredProducts'] ?? []
  );

  onCategoryImageError(categoryId: string): void {
    const failed = new Set(this.failedCategoryImages());
    failed.add(categoryId);
    this.failedCategoryImages.set(failed);
  }

  getCategoryImageSource(category: Category): string {
    return this.failedCategoryImages().has(category.id) 
      ? PLACEHOLDER_IMAGE_URL 
      : (category.thumbnail || PLACEHOLDER_IMAGE_URL);
  }

  isCategoryImageFailed(categoryId: string): boolean {
    return this.failedCategoryImages().has(categoryId);
  }

  stars(rating: number): boolean[] {
    return Array.from({ length: 5 }, (_, i) => i < Math.floor(rating));
  }
}
