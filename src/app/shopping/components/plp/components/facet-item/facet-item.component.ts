import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ItemModel } from '@shopping/models/item.model';

@Component({
  selector: 'facet-item',
  templateUrl: './facet-item.component.html',
  standalone: true,
  imports: [RouterLink]
})
export class FacetItemComponent {
  @Input() items: ItemModel[] = [];

  // SCA-safe price resolution
  getPrice(item: ItemModel): number | null {
    return item.onlinecustomerprice ?? item.pricelevel1 ?? null;
  }

  // Thumbnail fallback (important for SCA inconsistencies)
  getImage(item: ItemModel): string {
    return item.storedisplaythumbnail || (item as any).thumbnail?.url || '/assets/placeholder.png';
  }
}
