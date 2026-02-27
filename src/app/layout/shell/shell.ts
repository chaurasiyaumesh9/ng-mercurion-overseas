import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from '../header/header';
import { Footer } from '../footer/footer';
import { Store } from '@ngrx/store';
import { loadCategories } from '@appState/categories/categories.actions';
import { Breadcrumb } from '@layout/breadcrumb/breadcrumb';

@Component({
    selector: 'app-shell',
    standalone: true,
    imports: [RouterOutlet, Header, Footer, Breadcrumb],
    templateUrl: './shell.html',
})
export class Shell implements OnInit { 

    private store = inject(Store);
    
    constructor() {        
       
    }
    
    ngOnInit() {
        this.store.dispatch(loadCategories());
    }

}
