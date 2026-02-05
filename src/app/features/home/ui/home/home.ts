import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Category } from '@entities/catalog/category.model';
import { Product } from '@product//models/product.model';
import { Icon } from '@core/icons/icon';
import { ProductTile } from '@product-listing/ui/product-tile/product-tile';


@Component({
  standalone: true,
  selector: 'app-home-page',
  imports: [CommonModule, RouterModule, Icon, ProductTile],
  templateUrl: './home.html',
})
export class Home {

  private route = inject(ActivatedRoute);

  categories = signal<Category[]>(
    this.route.snapshot.data['categories'] ?? []
  );

  featuredProducts = signal<Product[]>(
    this.route.snapshot.data['featuredProducts'] ?? []
  );

  stars(rating: number): boolean[] {
    return Array.from({ length: 5 }, (_, i) => i < Math.floor(rating));
  }
}
