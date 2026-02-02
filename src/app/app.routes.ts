import { Routes } from '@angular/router';
import { categoriesResolver } from './core/resolvers/categories.resolver';

export const routes: Routes = [
	{
		path: '',
		loadChildren: () => import('./core/layout/layout.routes').then(m => m.LAYOUT_ROUTES),
        resolve: {
            categories: categoriesResolver
        },
	}
];

