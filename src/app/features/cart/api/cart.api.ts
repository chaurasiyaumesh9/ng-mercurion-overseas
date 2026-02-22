import { Injectable } from "@angular/core";
import { Product } from "@product//models/product.model";
import { Observable } from "rxjs/internal/Observable";
import { of } from "rxjs";

@Injectable({ providedIn: 'root' })
export class CartApi {
  getCrossSellProducts(): Observable<Product[]> {
    // TODO: Implement cross-sell products from API when available
    // Currently API only provides category-based products
    return of([]);
  }
}
