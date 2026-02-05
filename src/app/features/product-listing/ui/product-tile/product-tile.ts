import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Product } from '@product//models/product.model';

@Component({
    selector: 'app-product-tile',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './product-tile.html',
})
export class ProductTile {
    @Input() product!: Product;
}