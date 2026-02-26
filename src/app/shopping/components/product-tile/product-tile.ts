import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Product } from '@shopping/models/product.model';
import { PLACEHOLDER_IMAGE_URL } from '@core/constants/image.constants';

@Component({
    selector: 'app-product-tile',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './product-tile.html',
})
export class ProductTile {
    @Input() product!: Product;
    
    imageFailedToLoad = signal(false);

    onImageError(): void {
        this.imageFailedToLoad.set(true);
    }

    getImageSource(): string {
        return this.imageFailedToLoad() ? PLACEHOLDER_IMAGE_URL : (this.product?.image || PLACEHOLDER_IMAGE_URL);
    }
}