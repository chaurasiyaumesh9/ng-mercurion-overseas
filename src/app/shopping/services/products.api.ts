import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, catchError } from 'rxjs/operators';
import { Product } from '@shopping/models/product.model';
import { resolveMediaUrl } from '@core/resolvers/media.resolver';
import { SearchFacet } from '@shopping/models/dtos/search-facet.dto';
import { Observable, of } from 'rxjs';
import { SearchProductsResponse } from '@shopping/models/dtos/search-products-response.dto';
import { SearchProductItem } from '@shopping/models/dtos/search-product-item.dto';

export interface SearchProductsOptions {
    commerceCategoryUrl?: string;
    searchQuery?: string;
    page?: number;
    pageSize?: number;
    sort?: string;
    facets?: Map<string, Set<string>>;
    featured?: boolean;
    custitem_deal_products?: boolean;
}

export interface SearchProductsResult {
    products: Product[];
    total: number;
    page: number;
    pageSize: number;
    facets: SearchFacet[];
}

export interface ProductBreadcrumbNode {
    label: string;
    url: string;
}

@Injectable({ providedIn: 'root' })
export class ProductsApi {
    private readonly itemsApiUrl = '/api/items';
    private readonly productNameByUrlComponentState = signal<Record<string, string>>({});
    private readonly productBreadcrumbByUrlComponentState = signal<Record<string, ProductBreadcrumbNode[]>>({});
    readonly productNameByUrlComponent = this.productNameByUrlComponentState.asReadonly();
    readonly productBreadcrumbByUrlComponent = this.productBreadcrumbByUrlComponentState.asReadonly();

    constructor(private http: HttpClient) {}

    searchProducts(options: SearchProductsOptions): Observable<SearchProductsResult> {
        const page = options.page ?? 1;
        const pageSize = options.pageSize ?? 24;
        const offset = Math.max(0, (page - 1) * pageSize);

        let params = new HttpParams();
        params = params.set('c', 'TSTDRV2206481');
        params = params.set('country', 'US');
        params = params.set('currency', 'USD');
        params = params.set('fieldset', 'search');
        params = params.set('include', 'facets');
        params = params.set('language', 'en');
        params = params.set('limit', pageSize.toString());
        params = params.set('n', '6');
        params = params.set('offset', offset.toString());
        params = params.set('pricelevel', '5');
        params = params.set('sort', options.sort || 'commercecategory:desc');
        params = params.set('use_pcv', 'F');

        if(options.custitem_deal_products) {
            params = params.set('custitem_deal_products', true);
        }

        if (options.commerceCategoryUrl) {
            params = params.set('commercecategoryurl', options.commerceCategoryUrl);
        }
        if (options.searchQuery) {
            params = params.set('q', options.searchQuery);
        }

        if (options.facets && options.facets.size > 0) {
            options.facets.forEach((values, key) => {
                if (values.size > 0) {
                    params = params.set(key, Array.from(values).join(','));
                }
            });
        }

        return this.http.get<SearchProductsResponse>(this.itemsApiUrl, { params }).pipe(
            map((response) => {
                const items = response.items || [];
                const products = items.map((item) => this.mapSearchProductToProduct(item));
                const mappedProducts = options.featured ? products.filter((p) => p.featured) : products;
                this.cacheProductMetadata(items, products);

                return {
                    products: mappedProducts,
                    total: response.total ?? mappedProducts.length,
                    page,
                    pageSize,
                    facets: response.facets ?? [],
                };
            }),
            catchError((error) => {
                console.error('Failed to search products:', error);
                return of({ products: [], total: 0, page, pageSize, facets: [] });
            })
        );
    }

    private cacheProductMetadata(items: SearchProductItem[], products: Product[]): void {
        if (!products.length || products.length !== items.length) return;

        const currentNames = this.productNameByUrlComponentState();
        const nextNames = { ...currentNames };
        const currentBreadcrumbs = this.productBreadcrumbByUrlComponentState();
        const nextBreadcrumbs = { ...currentBreadcrumbs };
        let namesChanged = false;
        let breadcrumbsChanged = false;

        for (let i = 0; i < products.length; i++) {
            const product = products[i];
            const item = items[i];
            if (!product?.urlcomponent) continue;

            if (product.name && nextNames[product.urlcomponent] !== product.name) {
                nextNames[product.urlcomponent] = product.name;
                namesChanged = true;
            }

            const path = this.buildProductCategoryPath(item);
            const previous = nextBreadcrumbs[product.urlcomponent] ?? [];
            if (JSON.stringify(previous) !== JSON.stringify(path)) {
                nextBreadcrumbs[product.urlcomponent] = path;
                breadcrumbsChanged = true;
            }
        }

        if (namesChanged) {
            this.productNameByUrlComponentState.set(nextNames);
        }
        if (breadcrumbsChanged) {
            this.productBreadcrumbByUrlComponentState.set(nextBreadcrumbs);
        }
    }

    private mapSearchProductToProduct(item: SearchProductItem): Product {
        const imageUrl = item.itemimages_detail?.urls?.[0]?.url
            || item.itemimages_detail?.['01_Original']?.url
            || '';
        const categoryIds = Array.from(
            new Set((item.commercecategory?.categories ?? []).map((c) => `${c.id ?? ''}`).filter(Boolean))
        );

        return {
            id: `${item.internalid ?? ''}`,
            sku: item.itemid ?? '',
            urlcomponent: item.urlcomponent ?? item.itemid ?? '',
            name: item.displayname || item.itemid || '',
            price: item.onlinecustomerprice ?? 0,
            description: item.storedetaileddescription ?? '',
            image: resolveMediaUrl(imageUrl),
            categoryIds,
            inStock: item.isinstock ?? (item.quantityavailable ?? 0) > 0,
            quantityAvailable: item.quantityavailable ?? 0,
            featured: !!item.custitem_ns_ib_show_badges,
            brand: item.brand ?? '',
            color: item.color ?? '',
            gender: item.gender ?? '',
            material: item.material ?? '',
            style: item.style ?? '',
        };
    }

    getProductDetailsByUrlComponent(urlcomponent: string): Observable<Product | null> {
        let params = new HttpParams();
        params = params.set('c', 'TSTDRV2206481');
        params = params.set('country', 'US');
        params = params.set('currency', 'USD');
        params = params.set('fieldset', 'details');
        //params = params.set('include', 'facets');
        params = params.set('language', 'en');
        params = params.set('n', '6');
        params = params.set('pricelevel', '5');
        params = params.set('url', urlcomponent);
        params = params.set('use_pcv', 'F');

        return this.http.get<SearchProductsResponse>(this.itemsApiUrl, { params }).pipe(
            map((response) => {
                const item = response.items?.[0];
                if (!item) return null;

                const product = this.mapSearchProductToProduct(item);
                this.cacheProductMetadata([item], [product]);
                return product;
            }),
            catchError((error) => {
                console.error('Failed to load product details:', error);
                return of(null);
            }),
        );
    }

    private buildProductCategoryPath(item: SearchProductItem): ProductBreadcrumbNode[] {
        const categories = item.commercecategory?.categories ?? [];
        const nodes = categories
            .map((category) => ({
                label: category.name ?? '',
                url: category.urls?.[0] ?? '',
            }))
            .filter((node) => node.label && node.url);

        nodes.sort((a, b) => this.urlDepth(a.url) - this.urlDepth(b.url));

        const deduped: ProductBreadcrumbNode[] = [];
        const seen = new Set<string>();
        for (const node of nodes) {
            if (seen.has(node.url)) continue;
            seen.add(node.url);
            deduped.push(node);
        }

        return deduped;
    }

    private urlDepth(url: string): number {
        return (url ?? '').split('/').filter(Boolean).length;
    }

   
}

