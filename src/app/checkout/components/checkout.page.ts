import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CartStore } from '@shopping/stores/cart.store';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './checkout.page.html',
})
export class CheckoutPage {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  readonly cartStore = inject(CartStore);

  readonly step = signal<'info' | 'shipping' | 'payment'>('info');
  readonly submitted = signal(false);

  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    address: ['', [Validators.required, Validators.minLength(5)]],
    apartment: [''],
    city: ['', [Validators.required]],
    state: ['', [Validators.required]],
    zip: ['', [Validators.required, Validators.pattern(/^\d{5}(-\d{4})?$/)]],
    phone: ['', [Validators.required, Validators.pattern(/^\+?[0-9\s\-()]{10,}$/)]],
    shippingMethod: ['standard', [Validators.required]],
    cardName: ['', [Validators.required]],
    cardNumber: ['', [Validators.required, Validators.pattern(/^\d{16}$/)]],
    expiry: ['', [Validators.required, Validators.pattern(/^(0[1-9]|1[0-2])\/\d{2}$/)]],
    cvc: ['', [Validators.required, Validators.pattern(/^\d{3,4}$/)]],
  });

  readonly shipping = computed(() => (this.cartStore.subtotal() >= 300 ? 0 : this.cartStore.shipping()));
  readonly tax = computed(() => this.cartStore.tax());
  readonly total = computed(() => this.cartStore.subtotal() + this.shipping() + this.tax());

  constructor() {
    effect(() => {
      this.cartStore.loadCart();
    });
  }

  nextStep() {
    this.submitted.set(true);

    if (this.step() === 'info') {
      const infoFields = ['email', 'firstName', 'lastName', 'address', 'city', 'state', 'zip', 'phone'];
      infoFields.forEach((field) => this.form.get(field)?.markAsTouched());
      if (infoFields.some((field) => this.form.get(field)?.invalid)) return;
      this.step.set('shipping');
      this.submitted.set(false);
      return;
    }

    if (this.step() === 'shipping') {
      this.form.get('shippingMethod')?.markAsTouched();
      if (this.form.get('shippingMethod')?.invalid) return;
      this.step.set('payment');
      this.submitted.set(false);
      return;
    }

    const paymentFields = ['cardName', 'cardNumber', 'expiry', 'cvc'];
    paymentFields.forEach((field) => this.form.get(field)?.markAsTouched());
    if (paymentFields.some((field) => this.form.get(field)?.invalid)) return;

    localStorage.removeItem('cart');
    this.cartStore.loadCart();
    this.router.navigateByUrl('/order-confirmation');
  }

  error(fieldName: string, label: string) {
    const field = this.form.get(fieldName);
    if (!field || !(field.touched || this.submitted()) || !field.errors) return '';

    if (field.errors['required']) return `${label} is required.`;
    if (field.errors['email']) return 'Enter a valid email address.';
    if (field.errors['minlength']) return `${label} is too short.`;
    if (field.errors['pattern']) {
      if (fieldName === 'zip') return 'ZIP must be 5 digits (or ZIP+4).';
      if (fieldName === 'phone') return 'Enter a valid phone number.';
      if (fieldName === 'cardNumber') return 'Card number must be 16 digits.';
      if (fieldName === 'expiry') return 'Expiry must be MM/YY.';
      if (fieldName === 'cvc') return 'CVC must be 3 or 4 digits.';
    }
    return 'Invalid value.';
  }
}
