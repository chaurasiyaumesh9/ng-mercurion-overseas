import { Directive, HostListener, Input } from '@angular/core';
import { PLACEHOLDER_IMAGE_URL } from '@core/constants/image.constants';

@Directive({
  selector: 'img[appImageFallback]',
  standalone: true,
})
export class ImageFallbackDirective {
  @Input() fallbackSrc: string = PLACEHOLDER_IMAGE_URL;

  private hasReplaced = false;

  @HostListener('error', ['$event'])
  onError(event: Event) {
    if (this.hasReplaced) return;

    const img = event.target as HTMLImageElement;

    this.hasReplaced = true;
    img.src = this.fallbackSrc;
  }
}
