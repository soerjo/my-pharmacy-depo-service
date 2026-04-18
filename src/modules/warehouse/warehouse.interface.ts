export interface WarehouseProduct {
  id: string;
  name: string;
  description?: string | null;
  dosageForm?: string | null;
  strength?: string | null;
  productType: string;
  manufacturerId?: string | null;
  manufacturerName?: string | null;
  categoryId?: string | null;
  categoryName?: string | null;
  baseUnitId?: string | null;
  baseUnitName?: string | null;
  baseUnitCode?: string | null;
  baseUnitAbbreviation?: string | null;
  isActive?: boolean;
}

export interface WarehouseProductBatch {
  id: string;
  productId: string;
  batchNumber: string;
  quantity: number;
  expiryDate?: string;
}
