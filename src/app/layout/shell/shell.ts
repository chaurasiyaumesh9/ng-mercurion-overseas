import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from '../header/header';
import { Footer } from '../footer/footer';
import { CartStore } from '@shopping/stores/cart.store';


@Component({
    selector: 'app-shell',
    standalone: true,
    imports: [RouterOutlet, Header, Footer],
    templateUrl: './shell.html',
})
export class Shell { 
    constructor() {
        const cartStore = inject(CartStore);
        cartStore.loadCart();
    }

}
