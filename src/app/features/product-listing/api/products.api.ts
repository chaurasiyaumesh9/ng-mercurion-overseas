import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Product } from '@product//models/product.model';
import { environment } from 'environments/environment';
import { SearchProductsResponse, SearchProductItem, SearchFacet } from '@entities/catalog/search-products-response.model';

export interface SearchProductsOptions {
    categoryId?: string;
    searchQuery?: string;
    page?: number;
    pageSize?: number;
    sort?: string;
    facets?: Map<string, Set<string>>;
}

export interface SearchProductsResult {
    products: Product[];
    total: number;
    page: number;
    pageSize: number;
    facets: SearchFacet[];
}

@Injectable({ providedIn: 'root' })
export class ProductsApi {
    private searchApiUrl = `${environment.apiBaseUrl}/api/search`;

    constructor(private http: HttpClient) {}

    /**
     * Search products with support for category filtering, search keywords, pagination, sorting, and facet filtering
     */
    searchProducts(options: SearchProductsOptions): Observable<SearchProductsResult> {
        let params = new HttpParams();

        if (options.categoryId) {
            params = params.set('categoryId', options.categoryId);
        }
        if (options.searchQuery) {
            params = params.set('q', options.searchQuery);
        }
        if (options.page !== undefined && options.page !== null) {
            params = params.set('page', options.page.toString());
        }
        if (options.pageSize !== undefined && options.pageSize !== null) {
            params = params.set('pageSize', options.pageSize.toString());
        }
        if (options.sort) {
            params = params.set('sort', options.sort);
        }
        // Add facet filters to request
        if (options.facets && options.facets.size > 0) {
            options.facets.forEach((values, key) => {
                if (values.size > 0) {
                    params = params.set(key, Array.from(values).join(','));
                }
            });
        }

        return this.http.get<SearchProductsResponse>(`${this.searchApiUrl}/products`, { params }).pipe(
            map((response) => ({
                products: (response.items || []).map(item => this.mapSearchProductToProduct(item)),
                total: response.total,
                page: response.page,
                pageSize: response.pageSize,
                facets: response.facets || [],
            })),
            catchError((error) => {
                console.error('Failed to search products:', error);
                return of({ products: [], total: 0, page: 1, pageSize: 20, facets: [] });
            })
        );
    }

    private mapSearchProductToProduct(item: SearchProductItem): Product {
        return {
            id: item.id,
            sku: item.sku,
            name: item.name,
            price: item.price,
            description: item.description,
            image: item.imageUrl,
            inStock: item.quantityAvailable > 0,
            quantityAvailable: item.quantityAvailable,
        };
    }
}



