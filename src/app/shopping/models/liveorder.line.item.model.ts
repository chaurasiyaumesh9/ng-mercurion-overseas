import { ItemimagesDetail } from "./itemimages-detail.model";
import { ItemoptionsDetail } from "./itemoptions-detail.model";
import { OnlinecustomerpriceDetail } from "./onlinecustomerprice-detail.model";
import { QuantityavailableforstorepickupDetail } from "./quantityavailableforstorepickup-detail.model";

export interface LineItem {
  isinactive: boolean;
  isinstock: boolean;
  custitem_ns_pr_rating: number;
  isonline: boolean;
  matrixchilditems_detail: any;
  itemid: string;
  custitem_ns_pr_count: number;
  maximumquantity: any;
  minimumquantity: any;
  ispurchasable: boolean;
  stockdescription: string;
  isfulfillable: any;
  isbackorderable: boolean;
  itemimages_detail: ItemimagesDetail;
  onlinecustomerprice_detail: OnlinecustomerpriceDetail;
  internalid: number;
  showoutofstockmessage: boolean;
  itemtype: string;
  itemoptions_detail: ItemoptionsDetail;
  outofstockmessage: string;
  displayname: string;
  storedisplayname2: string;
  quantityavailableforstorepickup_detail: QuantityavailableforstorepickupDetail;
  pricelevel1: number;
  isstorepickupallowed: boolean;
  pricelevel1_formatted: string;
  urlcomponent: string;
  noLongerAvailable: boolean;
}