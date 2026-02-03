import { Component, Input } from "@angular/core";
import { CommonModule } from "@angular/common";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import { ICONS } from "./icon-map";

@Component({
  selector: 'app-icon',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span
      class="inline-block"
      [innerHTML]="svg"
      [ngClass]="class"
    ></span>
  `
})
export class Icon {
  @Input() name!: keyof typeof ICONS;
  @Input() class = '';

  svg!: SafeHtml;

  constructor(private sanitizer: DomSanitizer) {}

  ngOnInit() {
    this.svg = this.sanitizer.bypassSecurityTrustHtml(
      ICONS[this.name]
    );
  }
}
