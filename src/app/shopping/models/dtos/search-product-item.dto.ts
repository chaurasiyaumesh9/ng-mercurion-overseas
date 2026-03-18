export interface SearchProductItem {
  internalid?: string | number;
  itemid?: string;
  urlcomponent?: string;
  displayname?: string;
  storedetaileddescription?: string;
  onlinecustomerprice?: number;
  quantityavailable?: number;
  isinstock?: boolean;
  itemimages_detail?: SearchProductImagesDetail;
  commercecategory?: {
    categories?: SearchCommerceCategory[];
  };
  custitem_ns_ib_show_badges?: boolean;
  brand?: string;
  color?: string;
  gender?: string;
  material?: string;
  style?: string;
}

export interface SearchCommerceCategory {
  id?: string | number;
  name?: string;
  urls?: string[];
}

export interface SearchProductImage {
  url?: string;
  altimagetext?: string;
}

export interface SearchProductImagesDetail {
  urls?: SearchProductImage[];
  '01_Original'?: SearchProductImage;
}
