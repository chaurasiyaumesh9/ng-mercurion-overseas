import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { resolveMediaUrl } from '@core/resolvers/media.resolver';
import { CategoryDto } from '@shopping/models/dtos/category.dto';
import { Category } from '@shopping/models/category.model';
import { environment } from 'environments/environment';
import { map, Observable } from 'rxjs';

@Injectable()
export class CategoryService {
  private apiUrl = `${environment.apiBaseUrl}/api/search/categories`;

  constructor(private http: HttpClient) {}

  getCategories(): Observable<Category[]> {
    return this.http.get<CategoryDto[]>(this.apiUrl).pipe(map((dtos) => this.buildHierarchy(dtos)));
  }

  private buildHierarchy(dtos: CategoryDto[]): Category[] {
    const map = new Map<string, Category>();

    dtos.forEach((dto) => {
      map.set(dto.id, {
        id: dto.id,
        featured: dto.featured,
        name: dto.name,
        slug: dto.urlFragment,
        url: `/${dto.urlFragment}`,
        thumbnail: resolveMediaUrl(dto.thumbnail),
        subCategories: [],
      });
    });

    const roots: Category[] = [];

    dtos.forEach((dto) => {
      const current = map.get(dto.id)!;

      if (dto.primaryParent && map.has(dto.primaryParent)) {
        map.get(dto.primaryParent)!.subCategories.push(current);
      } else {
        roots.push(current);
      }
    });

    return roots;
  }
}
