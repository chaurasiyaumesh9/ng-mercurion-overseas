import { Component, inject } from '@angular/core';
import { BreadcrumbStore } from './breadcrumb.store';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [RouterLink],
  providers: [BreadcrumbStore],
  templateUrl: './breadcrumb.html',
})
export class Breadcrumb {
  readonly store = inject(BreadcrumbStore);
}