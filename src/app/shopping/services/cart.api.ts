import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { createEmptyCart } from '@shopping/models/cart.empty.model';
import { LiveOrderLine } from '@shopping/models/liveorder.line.model';
import { LiveOrderModel } from '@shopping/models/liveorder.model';
import { PayloadLiveOrderLine } from '@shopping/models/payloads/payload.liveorder.line.model';
import { Product } from '@shopping/models/product.model';
import { environment } from 'environments/environment';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class CartApi {
  constructor(private http: HttpClient) {}

  private buildLiveOrderUrl(): string {
    const baseUrl = (environment.categoriesApiBaseUrl || '').replace(/\/$/, '');
    const ts = Date.now();
    return `${baseUrl}/services/LiveOrder.Service.ss?c=TSTDRV2206481&cur=1&internalid=cart&n=6&t=${ts}`;
  }

  private buildLiveOrderLineUrl(lineId?: string): string {
    const baseUrl = (environment.categoriesApiBaseUrl || '').replace(/\/$/, '');
    const encodedLineId = lineId ? `&internalid=${encodeURIComponent(lineId)}` : '';
    return `${baseUrl}/services/LiveOrder.Line.Service.ss?c=TSTDRV2206481${encodedLineId}&n=6`;
  }

  private syncCart(lines: PayloadLiveOrderLine[]): Observable<void> {
    const url = this.buildLiveOrderUrl();
    const payload = { lines };
    return this.http.put<unknown>(url, payload).pipe(map(() => void 0));
  }

  getCart(): Observable<LiveOrderModel> {
    const url = this.buildLiveOrderUrl();
    return this.http.get<LiveOrderModel>(url).pipe(
      map((response) => response ?? createEmptyCart()),
      catchError((error) => {
        console.error('Failed to load cart from LiveOrder.Service.ss', error);
        return of(createEmptyCart());
      }),
    );
  }

  clearCart(): Observable<void> {
    return this.syncCart([] as PayloadLiveOrderLine[]);
  }

  addItem(
    payload: PayloadLiveOrderLine[],
  ): Observable<LiveOrderModel | LiveOrderLine | LiveOrderLine[] | null> {
    const url = this.buildLiveOrderLineUrl();
    return this.http.post<LiveOrderModel | LiveOrderLine | LiveOrderLine[] | null>(url, payload);
  }

  removeItem(lineId: string): Observable<LiveOrderModel | LiveOrderLine | LiveOrderLine[] | null> {
    const url = this.buildLiveOrderLineUrl(lineId);
    return this.http.delete<LiveOrderModel | LiveOrderLine | LiveOrderLine[] | null>(url);
  }

  updateQuantity(
    lineId: string,
    payload: PayloadLiveOrderLine,
  ): Observable<LiveOrderModel | LiveOrderLine | LiveOrderLine[] | null> {
    const url = this.buildLiveOrderLineUrl(lineId);
    return this.http.put<LiveOrderModel | LiveOrderLine | LiveOrderLine[] | null>(url, payload);
  }

  getCrossSellProducts(): Observable<Product[]> {
    // TODO: Implement cross-sell products from API when available
    // Currently API only provides category-based products
    return of([]);
  }
}
