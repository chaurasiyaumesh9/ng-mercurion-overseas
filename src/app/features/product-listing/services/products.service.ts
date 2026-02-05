import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/internal/Observable';
import { Product } from '../../../core/models/product.model';
import { Category } from '../../../core/models/category.model';
import { map } from 'rxjs';

@Injectable()
export class ProductsService {
    constructor(private http: HttpClient) {}

    getProducts(): Observable<Product[]> {
        return this.http.get<Product[]>(
            '/assets/mock-data/products/products.data.json'
        );
    }

    getProduct(id: string): Observable<Product> {
        return this.http.get<Product[]>(
            '/assets/mock-data/products/products.data.json'
        ).pipe(
            map(products => products.find(product => product.id === id)!)
        );
    }

    getCategories(): Observable<Category[]> {
        return this.http.get<Category[]>(
            '/assets/mock-data/categories/categories.data.json'
        );
    }
}
