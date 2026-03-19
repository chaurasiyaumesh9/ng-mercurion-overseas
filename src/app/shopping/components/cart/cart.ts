import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProductTile } from '../product-tile/product-tile';
import { CartStore } from '@shopping/stores/cart.store';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterLink, ProductTile],
  templateUrl: './cart.html'
})
export class Cart {

  store = inject(CartStore);

  constructor() {
    this.store.loadCart();
    this.store.loadCrossSell();
  }

}
