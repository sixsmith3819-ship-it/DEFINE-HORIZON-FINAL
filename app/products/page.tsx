import Link from 'next/link';
import { Plus, Package, Edit, Trash2, TrendingUp } from 'lucide-react';
import { getProducts, getProductStats } from '@/lib/actions/products';
import { DeleteProductButton } from '@/components/products/DeleteProductButton';

export default async function ProductsPage() {
  const result = await getProducts();
  const statsResult = await getProductStats();

  const products = result.success ? result.products || [] : [];
  const stats = statsResult.success ? statsResult.stats : null;

  const getStockStatus = (qty: number, threshold: number) => {
    if (qty === 0) return { label: 'Out of Stock', color: 'bg-red-100 text-red-800' };
    if (qty <= threshold) return { label: 'Low Stock', color: 'bg-yellow-100 text-yellow-800' };
    return { label: 'In Stock', color: 'bg-green-100 text-green-800' };
  };

  return (
    <div className="p-6" style={{ background: 'var(--dh-bg)', minHeight: '100vh' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--dh-text)' }}>Products & Stock</h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--dh-text-2)' }}>Manage product inventory</p>
          </div>
          <Link href="/products/new" className="dh-btn-primary">
            <Plus className="w-5 h-5" />
            Add Product
          </Link>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="dh-card stat-card p-5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                <Package className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--dh-text-3)' }}>Products</p>
                <p className="text-2xl font-bold" style={{ color: 'var(--dh-text)' }}>{stats.totalProducts}</p>
              </div>
            </div>
            <div className="dh-card stat-card p-5">
              <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--dh-text-3)' }}>Total Stock</p>
              <p className="text-2xl font-bold" style={{ color: 'var(--dh-text)' }}>{stats.totalQuantity}</p>
            </div>
            <div className="dh-card stat-card p-5">
              <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--dh-text-3)' }}>Low Stock</p>
              <p className="text-2xl font-bold" style={{ color: '#f59e0b' }}>{stats.lowStock}</p>
            </div>
            <div className="dh-card stat-card p-5">
              <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--dh-text-3)' }}>Out of Stock</p>
              <p className="text-2xl font-bold" style={{ color: '#ef4444' }}>{stats.outOfStock}</p>
            </div>
            <div className="dh-card stat-card p-5">
              <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--dh-text-3)' }}>Total Value</p>
              <p className="text-2xl font-bold" style={{ color: '#10b981' }}>${stats.totalValue.toFixed(2)}</p>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="dh-card overflow-hidden">
          {products.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-4" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                <Package className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-bold text-lg mb-2" style={{ color: 'var(--dh-text)' }}>No Products Yet</h3>
              <p className="text-sm mb-4" style={{ color: 'var(--dh-text-2)' }}>Add your first product to start tracking inventory.</p>
              <Link href="/products/new" className="dh-btn-primary">Add Product</Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="dh-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Brand / Model</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => {
                    const stockStatus = getStockStatus(product.quantity, product.lowStockThreshold)
                    return (
                      <tr key={product.id}>
                        <td className="font-semibold" style={{ color: 'var(--dh-text)' }}>{product.productName}</td>
                        <td>{product.category}</td>
                        <td style={{ color: 'var(--dh-text-2)' }}>{product.brand} {product.model}</td>
                        <td className="font-semibold">${product.sellingPrice.toFixed(2)}</td>
                        <td>
                          <span className={`font-bold ${product.quantity === 0 ? 'text-red-600' : product.quantity <= product.lowStockThreshold ? 'text-amber-600' : ''}`}>
                            {product.quantity}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${stockStatus.label === 'In Stock' ? 'badge-success' : stockStatus.label === 'Low Stock' ? 'badge-warning' : 'badge-error'}`}>
                            {stockStatus.label}
                          </span>
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <Link href={`/products/${product.id}/adjust-stock`} className="p-1.5 rounded-lg transition" style={{ color: '#10b981' }} title="Adjust Stock">
                              <TrendingUp className="w-4 h-4" />
                            </Link>
                            <Link href={`/products/${product.id}/edit`} className="p-1.5 rounded-lg transition" style={{ color: 'var(--dh-primary)' }} title="Edit">
                              <Edit className="w-4 h-4" />
                            </Link>
                            <DeleteProductButton productId={product.id} productName={product.productName} />
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
