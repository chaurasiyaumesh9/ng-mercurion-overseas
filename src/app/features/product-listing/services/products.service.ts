import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/internal/Observable';
import { Product } from '../../../core/models/product.model';
import { Category } from '../../../core/models/category.model';

@Injectable()
export class ProductsService {
    constructor(private http: HttpClient) {}

    getProducts(): Observable<Product[]> {
        return this.http.get<Product[]>(
            '/assets/mock-data/products/products.data.json'
        );
    }

    getCategories(): Observable<Category[]> {
        return this.http.get<Category[]>(
            '/assets/mock-data/categories/categories.data.json'
        );
    }
}
