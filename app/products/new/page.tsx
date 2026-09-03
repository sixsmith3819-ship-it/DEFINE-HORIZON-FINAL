'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { createProduct } from '@/lib/actions/products';
import { ProductCategory, ProductStatus } from '@/lib/types/product';
import { FieldError, FormErrorBanner } from '@/components/ui';
import { validateProductFormData, hasValidationErrors } from '@/lib/validation/product-validation';

export default function NewProductPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [submitError, setSubmitError] = useState('');
  const [formData, setFormData] = useState({
    productName: '',
    category: ProductCategory.Laptop,
    brand: '',
    model: '',
    sellingPrice: '',
    costPrice: '',
    quantity: '0',
    lowStockThreshold: '10',
    supplier: '',
    status: ProductStatus.Active,
  });

  const handleBlur = (fieldName: string) => {
    setTouched(prev => new Set(prev).add(fieldName));
    const allErrors = validateProductFormData(formData);
    setErrors(prev => ({ ...prev, [fieldName]: (allErrors as any)[fieldName] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});
    setSubmitError('');

    const allErrors = validateProductFormData(formData);
    if (hasValidationErrors(allErrors)) {
      setErrors(allErrors);
      setIsSubmitting(false);
      return;
    }

    const result = await createProduct(formData);

    if (result.success) {
      router.push('/products');
      router.refresh();
    } else if (result.validationErrors) {
      setErrors(result.validationErrors);
      setIsSubmitting(false);
    } else {
      setSubmitError(result.error || 'Failed to create product');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <Link href="/products" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft className="w-5 h-5" />
          Back to Products
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Add New Product</h1>
        <p className="text-sm text-gray-600">Add a new product to your inventory</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
        <FormErrorBanner message={submitError} />

        <div className="grid grid-cols-2 gap-6">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.productName}
              onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
              onBlur={() => handleBlur('productName')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., MacBook Pro 14"
              aria-describedby={errors.productName ? 'productName-error' : undefined}
            />
            <FieldError id="productName-error" message={errors.productName?.[0]} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as ProductCategory })}
              onBlur={() => handleBlur('category')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              aria-describedby={errors.category ? 'category-error' : undefined}
            >
              <option value={ProductCategory.Laptop}>Laptop</option>
              <option value={ProductCategory.Phone}>Phone</option>
              <option value={ProductCategory.Router}>Router</option>
              <option value={ProductCategory.Charger}>Charger</option>
              <option value={ProductCategory.Accessory}>Accessory</option>
            </select>
            <FieldError id="category-error" message={errors.category?.[0]} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as ProductStatus })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={ProductStatus.Active}>Active</option>
              <option value={ProductStatus.Discontinued}>Discontinued</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Brand</label>
            <input
              type="text"
              value={formData.brand}
              onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Apple"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Model</label>
            <input
              type="text"
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., M3 Pro"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Selling Price <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">$</span>
              <input
                type="number"
                step="0.01"
                value={formData.sellingPrice}
                onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                onBlur={() => handleBlur('sellingPrice')}
                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
                aria-describedby={errors.sellingPrice ? 'sellingPrice-error' : undefined}
              />
            </div>
            <FieldError id="sellingPrice-error" message={errors.sellingPrice?.[0]} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Cost Price (Optional)</label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">$</span>
              <input
                type="number"
                step="0.01"
                value={formData.costPrice}
                onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                onBlur={() => handleBlur('costPrice')}
                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
                aria-describedby={errors.costPrice ? 'costPrice-error' : undefined}
              />
            </div>
            <FieldError id="costPrice-error" message={errors.costPrice?.[0]} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Initial Quantity <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              onBlur={() => handleBlur('quantity')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0"
              aria-describedby={errors.quantity ? 'quantity-error' : undefined}
            />
            <FieldError id="quantity-error" message={errors.quantity?.[0]} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Low Stock Threshold <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={formData.lowStockThreshold}
              onChange={(e) => setFormData({ ...formData, lowStockThreshold: e.target.value })}
              onBlur={() => handleBlur('lowStockThreshold')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="10"
              aria-describedby={errors.lowStockThreshold ? 'lowStockThreshold-error' : undefined}
            />
            <FieldError id="lowStockThreshold-error" message={errors.lowStockThreshold?.[0]} />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Supplier (Optional)</label>
            <input
              type="text"
              value={formData.supplier}
              onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Supplier name or company"
            />
          </div>
        </div>

        <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <Save className="w-5 h-5" />
            {isSubmitting ? 'Creating...' : 'Create Product'}
          </button>
          <Link href="/products" className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
