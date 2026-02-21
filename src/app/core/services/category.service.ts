import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Category } from '@entities/catalog/category.model';
import { environment } from 'environments/environment';
import { Observable } from 'rxjs';

@Injectable()
export class CategoryService {

  private apiUrl = `${environment.apiBaseUrl}/api/netsuite/categories`;

  constructor(private http: HttpClient) { }

  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(this.apiUrl);
  }
}