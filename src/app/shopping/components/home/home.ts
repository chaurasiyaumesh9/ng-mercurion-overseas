import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProductTile } from '../product-tile/product-tile';
import { HomeStore } from '@shopping/stores/home.store';

@Component({
  standalone: true,
  selector: 'app-home-page',
  imports: [CommonModule, RouterModule, ProductTile],
  providers: [HomeStore],
  templateUrl: './home.html',
})
export class Home {
  readonly store = inject(HomeStore);
}
