import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CategoryRow } from '@entities/catalog/category-row.model';
import { Category } from '@entities/catalog/category.model';
import { environment } from 'environments/environment';
import { map, Observable } from 'rxjs';

@Injectable()
export class CategoryService {
  private apiUrl = `${environment.apiBaseUrl}/api/netsuite/categories`;

  constructor(private http: HttpClient) {}

  getCategories(): Observable<Category[]> {
    return this.http.get<CategoryRow[]>(this.apiUrl).pipe(map((rows) => this.buildHierarchy(rows)));
  }

  private buildHierarchy(rows: CategoryRow[]): Category[] {
    const map = new Map<string, Category>();

    // First pass: create category objects
    rows.forEach((row) => {
      map.set(row.id, {
        id: row.id,
        name: row.name,
        slug: row.urlFragment,
        url: `/${row.urlFragment}`,
        image: row.imageUrl,
        subCategories: []
      });
    });

    const roots: Category[] = [];

    // Second pass: attach children
    rows.forEach((row) => {
      const current = map.get(row.id)!;

      if (row.primaryParent && map.has(row.primaryParent)) {
        map.get(row.primaryParent)!.subCategories.push(current);
      } else {
        roots.push(current);
      }
    });

    return roots;
  }
}
