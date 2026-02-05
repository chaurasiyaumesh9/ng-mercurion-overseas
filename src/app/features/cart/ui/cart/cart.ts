import { Component, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CartStore } from '../../state/cart.store';
import { ProductTile } from '../../../product-listing/ui/product-tile/product-tile';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterLink, ProductTile],
  templateUrl: './cart.html'
})
export class Cart {

  store = inject(CartStore);

  constructor() {
    effect(() => {
      this.store.loadCart();
      this.store.loadCrossSell();
    });
  }

}
