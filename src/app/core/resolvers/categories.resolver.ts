import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { Category } from '@entities/catalog/category.model';
import { CategoryService } from '@core/services/category.service';

export const categoriesResolver: ResolveFn<Category[]> = () => {
    const categoryService = inject(CategoryService);
    return categoryService.getCategories();
};
