import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CategoryDto } from '@shopping/models/dtos/category.dto';
import { Observable } from 'rxjs';
import { environment } from 'environments/environment';

@Injectable({ providedIn: 'root' })
export class CategoriesApi {
  
  constructor(private http: HttpClient) {}

  getCategories(): Observable<CategoryDto[]> {
    const baseUrl = (environment.categoriesApiBaseUrl || '').replace(/\/$/, '');
    const apiUrl = `${baseUrl}/services/Categories.Service.ss?country=US&language=en&menuLevel=3`;
    return this.http.get<CategoryDto[]>(apiUrl);
  }

  
}
