
export enum AssetType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  MAIN = 'MAIN',
  DETAIL = 'DETAIL'
}

export interface WebAsset {
  id: string;
  url: string;
  type: AssetType;
  title?: string;
  thumbnail?: string;
  dimensions?: { width: number; height: number };
}

export interface ExtractionResult {
  title: string;
  mainImages: string[];
  detailImages: string[];
  videos: string[];
}
