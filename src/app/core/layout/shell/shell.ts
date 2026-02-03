import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from '../header/header';
import { Footer } from '../footer/footer';

@Component({
    selector: 'app-shell',
    standalone: true,
    imports: [RouterOutlet, Header, Footer],
    templateUrl: './shell.html',
})
export class Shell { }
