export interface OrderItem {
  id: string;
  poNumber: string;
  styleName: string;
  styleNumber: string;
  color: string;
  colorCode: string;
  colorComment?: string;
  styleComment?: string;
  silhouette: string;
  materials?: string;
  fabrication?: string;
  countryOfOrigin?: string;
  sizes: Record<string, number>;
  suggRetailEur: number;
  wholesaleEur: number;
  itemDiscount?: number;
  unitsOrdered: number;
  totalEur: number;
  status?: 'Approved' | 'Cancelled' | 'Pending';
}

export interface StylePhoto {
  styleName: string;
  colorName: string;
  image: string;
  linesheet: string;
  silhouetteName: string;
}

export interface SellOutItem {
  style: string;
  colour: string;
  size: string;
  qtySold: number;
  styleClean: string;
  colorPrefix: string;
  silhouette?: string;
}

export interface MergedProduct {
  id: string;
  styleName: string;
  styleClean: string;
  styleNumber: string;
  color: string;
  colorCode: string;
  colorPrefix: string;
  silhouette: string;
  fabrication: string;
  image: string;
  linesheet: string;
  wholesaleEur: number;
  suggRetailEur: number;
  unitsOrdered: number;
  unitsSold: number;
  stockRemaining: number;
  sellOutPct: number;
  totalWholesaleEur: number;
  totalRetailEur: number;
  realizedRevenueEur: number;
  poNumbers: string[];
  sizesOrdered: Record<string, number>;
  sizesSold: Record<string, number>;
  cancelledUnits?: number;
  isCancelled?: boolean;
}

export interface BoutiqueInfo {
  name: string;
  location: string;
  address: string;
  representative: string;
  email: string;
  customerId: string;
  reportDate: string;
  orderSeason: string;
  clientLines?: string[];
}

export type ViewMode = 'lookbook' | 'table' | 'categories' | 'sizes' | 'linesheets';

export interface FilterState {
  search: string;
  silhouette: string;
  linesheet: string;
  performanceTier: 'all' | 'bestseller' | 'healthy' | 'slow' | 'soldout';
  sortBy: 'sellOutDesc' | 'sellOutAsc' | 'soldDesc' | 'orderedDesc' | 'stockDesc' | 'revenueDesc' | 'nameAsc';
  poFilter: string;
}
