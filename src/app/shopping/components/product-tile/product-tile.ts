import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Product } from '@shopping/models/product.model';
import { ImageFallbackDirective } from '@core/directives/image-fallback.directive';

@Component({
    selector: 'app-product-tile',
    standalone: true,
    imports: [CommonModule, RouterLink, ImageFallbackDirective],
    templateUrl: './product-tile.html',
})
export class ProductTile {
    @Input() product!: Product;    
    
}