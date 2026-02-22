import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Product } from '@product//models/product.model';
import { environment } from 'environments/environment';
import { CategoryItemsResponse, CategoryItemRow } from '@product/models/category-items-response.model';

@Injectable({ providedIn: 'root' })
export class ProductsApi {
    private apiUrl = `${environment.apiBaseUrl}/api/netsuite`;

    constructor(private http: HttpClient) {}

    /**
     * Fetch products by category ID
     */
    getProductsByCategory(categoryId: string): Observable<Product[]> {
        return this.http.get<CategoryItemsResponse>(`${this.apiUrl}/categories/${categoryId}/items`).pipe(
            map((response) => {
                if (!response.items || !Array.isArray(response.items)) return [];
                return response.items.map(item => this.mapToProduct(item));
            }),
            catchError(() => {
                console.error(`Failed to fetch products for category ${categoryId}`);
                return of([]);
            })
        );
    }

    private mapToProduct(item: CategoryItemRow): Product {
        return {
            id: item.id,
            name: item.name,
            price: parseFloat(item.price),
            image: item.imageUrl,
            description: item.description,
            rating: 0, // API doesn't provide ratings
            reviews: [], // API doesn't provide reviews
            inStock: parseInt(item.quantityAvailable, 10) > 0,
            category: {
                id: '',
                name: '',
                slug: '',
                url: '',
                image: '',
                subCategories: []
            },
            subCategory: {
                id: '',
                name: '',
                slug: '',
                url: ''
            },
            url: `/product/${item.id}`,
            breadcrumbs: [],
            meta: {
                title: item.name,
                description: item.description,
                keywords: [item.name]
            }
        };
    }
}
