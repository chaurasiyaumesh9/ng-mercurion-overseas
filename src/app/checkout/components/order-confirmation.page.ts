import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="lux-container py-20 text-center">
      <p class="text-xs uppercase tracking-[0.2em] text-gray-500">Order Confirmed</p>
      <h1 class="lux-title mt-3 text-6xl">Thank You</h1>
      <p class="mx-auto mt-4 max-w-xl text-sm text-gray-600">
        Your order has been placed successfully. A confirmation email has been sent with shipment details.
      </p>
      <div class="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <a routerLink="/search" class="lux-btn">Continue Shopping</a>
        <a routerLink="/account" class="lux-btn-light">View Account</a>
      </div>
    </div>
  `,
})
export class OrderConfirmationPage {}
