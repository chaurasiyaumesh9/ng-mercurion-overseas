import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { ItemsResponse } from "@shopping/models/facets.model";

@Injectable({ providedIn: 'root' })
export class ItemsApi {
  constructor(private http: HttpClient) {}

  getItems(params: Record<string, any>) {
    return this.http.get<ItemsResponse>('/api/items', {
      params
    });
  }
}