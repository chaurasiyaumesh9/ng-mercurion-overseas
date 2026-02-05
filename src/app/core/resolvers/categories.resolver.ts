import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Category } from '@entities/catalog/category.model';

export const categoriesResolver: ResolveFn<Category[]> = () => {
  const http = inject(HttpClient);
  return http.get<Category[]>(
    '../../../assets/mock-data/categories/categories.data.json'
  );
};
