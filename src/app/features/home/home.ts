import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CartService } from '../cart/services/cart.services';
import { Category } from '../../core/models/category.model';
import { Product } from '../../core/models/product.model';
import { Icon } from '../../core/icons/icon';
import { ProductTile } from '../product-listing/components/product-tile';


@Component({
  standalone: true,
  selector: 'app-home-page',
  imports: [CommonModule, RouterModule, Icon, ProductTile],
  providers: [CartService],
  templateUrl: './home.html',
})
export class Home {

  private cart = inject(CartService);
  private route = inject(ActivatedRoute);

  categories = signal<Category[]>(
    this.route.snapshot.data['categories'] ?? []
  );

  featuredProducts = signal<Product[]>(
    this.route.snapshot.data['featuredProducts'] ?? []
  );

  addToCart(product: Product) {
    this.cart.addToCart(product);
  }

  stars(rating: number): boolean[] {
    return Array.from({ length: 5 }, (_, i) => i < Math.floor(rating));
  }
}
