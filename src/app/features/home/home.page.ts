import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CartService } from '../cart/services/cart.services';
import { Category } from '../../core/models/category.model';
import { Product } from '../../core/models/product.model';


@Component({
  standalone: true,
  selector: 'app-home-page',
  imports: [CommonModule, RouterModule],
  providers: [CartService],
  template: `
<div class="w-full">

  <!-- Hero (never deferred) -->
  <section class="w-full bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
    <div class="container mx-auto px-4">
      <div class="max-w-3xl">
        <h1 class="text-5xl md:text-6xl font-bold mb-6">
          Connecting Markets Worldwide
        </h1>
        <p class="text-xl mb-8">
          Premium quality products from across the globe.
        </p>
        <a
          routerLink="/products"
          class="inline-flex items-center gap-2 bg-white text-blue-600 px-8 py-4 rounded-lg hover:bg-gray-100 transition"
        >
          Shop Now →
        </a>
      </div>
    </div>
  </section>

  <!-- Categories (lazy) -->
  @defer (on viewport) {
    <section class="w-full py-16 bg-gray-50">
      <div class="container mx-auto px-4">
        <h2 class="text-3xl font-bold text-center mb-12">
          Featured Categories
        </h2>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          @for (category of categories().slice(0,6); track category.id) {
            <a
              [routerLink]="['/products']"
              [queryParams]="{ category: category.name }"
              class="group bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition"
            >
              <div class="aspect-video bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                🛍️
              </div>

              <div class="p-6">
                <h3 class="text-xl font-bold mb-2 group-hover:text-blue-600">
                  {{ category.name }}
                </h3>
                <p class="text-gray-600 text-sm mb-4">
                  {{ category.subCategories.length }} subcategories
                </p>
                <span class="text-blue-600 text-sm">
                  Explore →
                </span>
              </div>
            </a>
          }
        </div>
      </div>
    </section>
  } @placeholder {
    <div class="h-64 flex items-center justify-center text-gray-400">
      Loading categories…
    </div>
  }

  <!-- Featured Products (lazy) -->
  @defer (on viewport) {
    <section class="w-full py-16">
      <div class="container mx-auto px-4">
        <div class="flex justify-between items-center mb-12">
          <h2 class="text-3xl font-bold">Featured Products</h2>
          <a routerLink="/products" class="text-blue-600">
            View All →
          </a>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          @for (product of featuredProducts(); track product.id) {
            <div class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition">
              <a [routerLink]="['/product', product.id]">
                <div class="aspect-square bg-gray-100">
                  <img
                    [src]="product.image"
                    [alt]="product.name"
                    class="w-full h-full object-cover"
                  />
                </div>
              </a>

              <div class="p-4">
                <a [routerLink]="['/product', product.id]">
                  <h3 class="font-medium mb-2">
                    {{ product.name }}
                  </h3>
                </a>

                <div class="flex items-center gap-2 mb-4">
                  <span class="text-lg font-bold text-blue-600">
                    {{ product.price | currency }}
                  </span>

                  @if (product.originalPrice) {
                    <span class="line-through text-sm text-gray-400">
                      {{ product.originalPrice | currency }}
                    </span>
                  }
                </div>

                <div class="flex items-center gap-2 mb-3">
                  @for (filled of stars(product.rating); track $index) {
                    <span
                      class="text-sm"
                      [class.text-yellow-400]="filled"
                      [class.text-gray-300]="!filled"
                    >
                      ★
                    </span>
                  }
                  <span class="text-xs text-gray-600">
                    ({{ product.reviews.length }})
                  </span>
                </div>

                <button
                  (click)="addToCart(product)"
                  class="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
                >
                  Add to Cart
                </button>
              </div>
            </div>
          }
        </div>
      </div>
    </section>
  } @placeholder {
    <div class="h-64 flex items-center justify-center text-gray-400">
      Loading featured products…
    </div>
  }

</div>
`
})
export class HomePage {

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
