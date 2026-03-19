export interface Url {
  altimagetext: string;
  url: string;
}

export interface N01Original {
  altimagetext: string;
  url: string;
}

export interface ItemimagesDetail {
  urls: Url[];
  "01_Original": N01Original;
}