import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CategoryDto } from '@shopping/models/dtos/category.dto';
import { Observable } from 'rxjs';
import { shareReplay } from 'rxjs/operators';
import { environment } from 'environments/environment';

@Injectable({ providedIn: 'root' })
export class CategoriesApi {
  constructor(private http: HttpClient) {}
  private categoriesRequest$: Observable<CategoryDto[]> | null = null;

  getCategories(): Observable<CategoryDto[]> {
    if (this.categoriesRequest$) {
      return this.categoriesRequest$;
    }

    const baseUrl = (environment.categoriesApiBaseUrl || '').replace(/\/$/, '');
    const apiUrl = `${baseUrl}/services/Categories.Service.ss?country=US&language=en&menuLevel=3`;
    this.categoriesRequest$ = this.http.get<CategoryDto[]>(apiUrl).pipe(
      // Cache categories in-memory for the session to avoid repeat menu fetches.
      shareReplay({ bufferSize: 1, refCount: false }),
    );
    return this.categoriesRequest$;
  }
}
