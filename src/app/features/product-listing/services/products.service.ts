import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/internal/Observable';
import { map } from 'rxjs';
import { Product } from '@product//models/product.model';
import { Category } from '@entities/catalog/category.model';

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
