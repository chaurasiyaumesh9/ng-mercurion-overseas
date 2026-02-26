import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, catchError } from 'rxjs/operators';
import { Product } from '@shopping/models/product.model';
import { environment } from 'environments/environment';
import { resolveMediaUrl } from '@core/resolvers/media.resolver';
import { SearchFacet } from '@shopping/models/dtos/search-facet.dto';
import { SearchProductsResponse } from '@shopping/models/dtos/search-products-response.dto';
import { SearchProductItem } from '@shopping/models/dtos/search-product-item.dto';
import { Observable } from 'rxjs/internal/Observable';
import { of } from 'rxjs/internal/observable/of';

export interface SearchProductsOptions {
    categoryId?: string;
    searchQuery?: string;
    page?: number;
    pageSize?: number;
    sort?: string;
    facets?: Map<string, Set<string>>;
    featured?: boolean;
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

    searchProducts(options: SearchProductsOptions): Observable<SearchProductsResult> {
        let params = new HttpParams();

        if (options.categoryId) {
            params = params.set('categoryIds', options.categoryId);
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
        if (options.featured !== undefined && options.featured !== null) {
            params = params.set('featured', options.featured.toString());
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
            image: resolveMediaUrl(item.imageUrl),
            inStock: item.quantityAvailable > 0,
            quantityAvailable: item.quantityAvailable,
            featured: !!item.featured,
        };
    }
}



