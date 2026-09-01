/**
 * Product & Stock Management Types
 */

export enum ProductCategory {
  Laptop = 'Laptop',
  Phone = 'Phone',
  Router = 'Router',
  LaptopCharger = 'Laptop Charger',
  Accessory = 'Accessory',
}

export enum ProductStatus {
  Active = 'active',
  Inactive = 'inactive',
}

export enum MovementType {
  In = 'in',
  Out = 'out',
  Adjustment = 'adjustment',
}

export interface Product {
  id: string;
  productName: string;
  category: ProductCategory;
  brand?: string;
  model?: string;
  sellingPrice: number;
  costPrice?: number;
  quantity: number;
  lowStockThreshold: number;
  supplier?: string;
  status: ProductStatus;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  movementType: MovementType;
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  reason?: string;
  referenceNumber?: string;
  createdAt: string;
  createdBy: string;
}

export interface ProductFormData {
  productName: string;
  category: ProductCategory;
  brand?: string;
  model?: string;
  sellingPrice: string;
  costPrice?: string;
  quantity: string;
  lowStockThreshold: string;
  supplier?: string;
  status: ProductStatus;
}

export interface StockAdjustment {
  productId: string;
  movementType: MovementType;
  quantity: string;
  reason?: string;
  referenceNumber?: string;
}

export interface ProductStats {
  totalProducts: number;
  totalQuantity: number;
  lowStock: number;
  outOfStock: number;
  totalValue: number;
}
