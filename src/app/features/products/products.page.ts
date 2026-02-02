import { Component, inject, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductsStore } from './state/products.store';
import { Router } from '@angular/router';

@Component({
    selector: 'app-products-page',
    standalone: true,
    imports: [CommonModule],
    providers: [ProductsStore],
    template: `
<div class="container mx-auto px-4 py-8">

  <!-- Heading -->
  <div class="mb-6">
    <h1 class="text-2xl font-bold text-gray-800">
    @switch (true) {
        @case (!!search()) { Search results for "{{ search() }}" }
        @case (!!subCategorySlug()) { {{ subCategorySlug() | titlecase }} }
        @case (!!categorySlug()) { {{ categorySlug() | titlecase }} }
        @default { All Products }
    }
    </h1>
  </div>

  <!-- Loading -->
  @if (loading()) {
    <div class="text-center py-20 text-gray-500">
      Loading products...
    </div>
  }

  <!-- Empty -->
  @if (!loading() && products().length === 0) {
    <div class="text-center py-20 text-gray-500">
      No products found.
    </div>
  }

  <!-- Grid -->
  @defer (on viewport) {
    @if (!loading() && products().length > 0) {
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">

        @for (product of products(); track product.id) {
          <div class="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition">

            <img
              [src]="product.image"
              [alt]="product.name"
              class="w-full h-48 object-cover">

            <div class="p-4 flex flex-col gap-2">
              <h3 class="font-semibold text-gray-800">
                {{ product.name }}
              </h3>

              <p class="text-sm text-gray-500 line-clamp-2">
                {{ product.description }}
              </p>

              <div class="flex items-center gap-2">
                <span class="text-lg font-bold text-gray-900">
                  {{ product.price }}
                </span>

                @if (product.originalPrice) {
                  <span class="text-sm line-through text-gray-400">
                    {{ product.originalPrice }}
                  </span>
                }
              </div>

              <div class="text-sm text-yellow-500">
                ⭐ {{ product.rating }}
              </div>

              <div class="text-xs text-gray-400">
                {{ product.categorySlug }} / {{ product.subCategorySlug }}
              </div>

              <button
                class="mt-2 bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
                View product
              </button>
            </div>
          </div>
        }
      </div>
    }
  } @placeholder {
    <div class="text-center py-20 text-gray-400">
      Preparing product grid...
    </div>
  }

</div>
`
})
export class ProductsPage {
    readonly store = inject(ProductsStore);

    products = this.store.filteredProducts;
    loading = this.store.loading;
    categorySlug = this.store.categorySlug;
    subCategorySlug = this.store.subCategorySlug;
    search = this.store.search;

    constructor() {
        this.store.init();
    }
}
