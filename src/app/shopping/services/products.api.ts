import { Injectable, signal } from '@angular/core';
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
    sku?: string;
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
    private readonly productNameBySkuState = signal<Record<string, string>>({});
    readonly productNameBySku = this.productNameBySkuState.asReadonly();

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
        if (options.featured) {
            params = params.set('featured', true);
        }
        if (options.sku) {
            params = params.set('sku', options.sku);
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
            map((response) => {
                const products = (response.items || []).map(item => this.mapSearchProductToProduct(item));
                this.cacheProductNames(products);

                return {
                    products,
                    total: response.total,
                    page: response.page,
                    pageSize: response.pageSize,
                    facets: response.facets || [],
                };
            }),
            catchError((error) => {
                console.error('Failed to search products:', error);
                return of({ products: [], total: 0, page: 1, pageSize: 20, facets: [] });
            })
        );
    }

    private cacheProductNames(products: Product[]): void {
        if (!products.length) return;

        const current = this.productNameBySkuState();
        const next = { ...current };
        let changed = false;

        for (const product of products) {
            if (!product?.sku || !product?.name) continue;
            if (next[product.sku] === product.name) continue;

            next[product.sku] = product.name;
            changed = true;
        }

        if (changed) {
            this.productNameBySkuState.set(next);
        }
    }

    private mapSearchProductToProduct(item: SearchProductItem): Product {
        return {
            id: item.id,
            sku: item.sku,
            name: item.name,
            price: item.price,
            description: item.description,
            image: resolveMediaUrl(item.imageUrl),
            categoryIds: item.categoryIds ?? [],
            inStock: item.quantityAvailable > 0,
            quantityAvailable: item.quantityAvailable,
            featured: !!item.featured,
            brand: item.brand ?? '',
            color: item.color ?? '',
            gender: item.gender ?? '',
            material: item.material ?? '',
            style: item.style ?? '',
        };
    }

    getProducts(): Observable<any> {
        // let params = new HttpParams();
        //     params = params.set('c', 'TSTDRV2206481');
        //     params = params.set('country', 'US');
        //     params = params.set('country', 'US');
        //     params = params.set('currency', 'USD');
        //     params = params.set('fieldset', 'search');
        //     params = params.set('include', 'facets');
        //     params = params.set('language', 'en');
        //     params = params.set('limit', '24');
        //     params = params.set('n', '6');
        //     params = params.set('offset', '0');
        //     params = params.set('pricelevel', '5');
        //     params = params.set('sort', 'relevance:desc');
        //     params = params.set('use_pcv', 'F');
        //     params = params.set('commercecategoryurl', '/sports');

        //const apiUrl = `${this.searchApiUrl}/external/items`;
        const apiUrl = '/services/Categories.Service.ss?c=TSTDRV2206481&country=US&currency=USD&language=en&menuLevel=3';
        //const apiUrl = '/api/items?c=TSTDRV2206481&commercecategoryurl=%2Fsports&country=US&currency=USD&fieldset=search&include=facets&language=en&limit=24&n=6&offset=0&pricelevel=5&sort=commercecategory%3Adesc&use_pcv=F';
        return this.http.get<any>(apiUrl);
    }
}



