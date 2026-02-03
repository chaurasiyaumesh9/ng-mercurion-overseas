import { Component, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product } from '../../../core/models/product.model';
import { Icon } from '../../../core/icons/icon';

@Component({
    selector: 'app-product-tile',
    standalone: true,
    imports: [CommonModule, Icon],
    templateUrl: './product-tile.html',
})
export class ProductTile {
    @Input() product!: Product;
}