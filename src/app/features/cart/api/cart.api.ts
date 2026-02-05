import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Product } from "@product//models/product.model";
import { Observable } from "rxjs/internal/Observable";
import { map } from "rxjs/internal/operators/map";

@Injectable({ providedIn: 'root' })
export class CartApi {
  constructor(private http: HttpClient) {}

  getCrossSellProducts(): Observable<Product[]> {
    return this.http
      .get<Product[]>('/assets/mock-data/products/products.data.json')
      .pipe(
        map(products =>
          products
            .filter(p => p.category?.id === 'corporate-bulk')
            .slice(0, 5)
        )
      );
  }
}
