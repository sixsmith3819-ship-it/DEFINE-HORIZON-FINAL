'use server';

import { createServerClient } from '@/lib/supabase-server';
import { Product, ProductFormData, ProductStats } from '@/lib/types/product';
import { validateProductFormData, hasValidationErrors } from '@/lib/validation/product-validation';

export async function createProduct(data: ProductFormData): Promise<{ success: boolean; productId?: string; error?: string; validationErrors?: Record<string, string[]> }> {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (!profile || profile.role !== 'admin') return { success: false, error: 'Admin only' };

    const validationErrors = validateProductFormData(data);
    if (hasValidationErrors(validationErrors)) return { success: false, validationErrors };

    const { data: product, error } = await supabase.from('products').insert({
      product_name: data.productName,
      category: data.category,
      brand: data.brand || null,
      model: data.model || null,
      selling_price: parseFloat(data.sellingPrice),
      cost_price: data.costPrice ? parseFloat(data.costPrice) : null,
      quantity: parseInt(data.quantity),
      low_stock_threshold: parseInt(data.lowStockThreshold),
      supplier: data.supplier || null,
      status: data.status,
      created_by: user.id,
      updated_by: user.id,
    }).select('id').single();

    if (error) throw error;
    return { success: true, productId: product.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getProducts(): Promise<{ success: boolean; products?: Product[]; error?: string }> {
  try {
    const supabase = await createServerClient();
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (error) throw error;

    const products = (data || []).map((p: any) => ({
      id: p.id,
      productName: p.product_name,
      category: p.category,
      brand: p.brand,
      model: p.model,
      sellingPrice: parseFloat(p.selling_price),
      costPrice: p.cost_price ? parseFloat(p.cost_price) : undefined,
      quantity: p.quantity,
      lowStockThreshold: p.low_stock_threshold,
      supplier: p.supplier,
      status: p.status,
      createdAt: p.created_at,
      createdBy: p.created_by,
      updatedAt: p.updated_at,
      updatedBy: p.updated_by,
    }));

    return { success: true, products };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getProductStats(): Promise<{ success: boolean; stats?: ProductStats; error?: string }> {
  try {
    const supabase = await createServerClient();
    const { data, error } = await supabase.from('products').select('*');
    if (error) throw error;

    const stats: ProductStats = {
      totalProducts: data.length,
      totalQuantity: data.reduce((sum, p) => sum + p.quantity, 0),
      lowStock: data.filter(p => p.quantity > 0 && p.quantity <= p.low_stock_threshold).length,
      outOfStock: data.filter(p => p.quantity === 0).length,
      totalValue: data.reduce((sum, p) => sum + (p.quantity * parseFloat(p.selling_price)), 0),
    };

    return { success: true, stats };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
