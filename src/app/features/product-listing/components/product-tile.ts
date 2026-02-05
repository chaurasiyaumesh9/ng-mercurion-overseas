import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product } from '../../../core/models/product.model';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-product-tile',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './product-tile.html',
})
export class ProductTile {
    @Input() product!: Product;
}