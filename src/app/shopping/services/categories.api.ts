import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CategoryDto } from '@shopping/models/dtos/category.dto';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CategoriesApi {
  
  constructor(private http: HttpClient) {}

  getCategories(): Observable<CategoryDto[]> {
    const apiUrl = '/services/Categories.Service.ss?country=US&language=en&menuLevel=3';
    return this.http.get<CategoryDto[]>(apiUrl);
  }

  
}
