import { Routes } from '@angular/router';
import { categoriesResolver } from './shopping/resolvers/categories.resolver';
import { CategoryService } from '@shopping/services/categories.api';

export const routes: Routes = [
	{
		path: '',
		loadChildren: () => import('./layout/layout.routes').then(m => m.LAYOUT_ROUTES),
        providers: [CategoryService],
        resolve: {
            categories: categoriesResolver
        },
	}
];

