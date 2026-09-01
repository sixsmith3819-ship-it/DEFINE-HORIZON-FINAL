'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Plus, Minus } from 'lucide-react';
import Link from 'next/link';
import { getProduct, adjustStock } from '@/lib/actions/products';

export default function AdjustStockPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [product, setProduct] = useState<any>(null);
  const [adjustment, setAdjustment] = useState('0');
  const [reason, setReason] = useState('');
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'remove'>('add');

  useEffect(() => {
    async function loadProduct() {
      const result = await getProduct(productId);
      if (result.success && result.product) {
        setProduct(result.product);
      }
      setIsLoading(false);
    }
    loadProduct();
  }, [productId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const adjustmentValue = adjustmentType === 'add' ? parseInt(adjustment) : -parseInt(adjustment);
    const result = await adjustStock(productId, adjustmentValue, reason);
    if (result.success) {
      router.push('/products');
      router.refresh();
    } else {
      alert(result.error || 'Failed to adjust stock');
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className=\"p-6\">Loading...</div>;
  if (!product) return <div className=\"p-6\">Product not found</div>;

  const newQuantity = adjustmentType === 'add' 
    ? product.quantity + parseInt(adjustment || '0') 
    : product.quantity - parseInt(adjustment || '0');

  return (
    <div className=\"p-6 max-w-2xl mx-auto\">
      <Link href=\"/products\" className=\"flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4\">
        <ArrowLeft className=\"w-5 h-5\" />
        Back to Products
      </Link>
      <h1 className=\"text-2xl font-bold text-gray-900 mb-2\">Adjust Stock</h1>
      <p className=\"text-gray-600 mb-6\">{product.productName}</p>

      <div className=\"bg-white rounded-lg shadow p-6 space-y-6\">
        <div className=\"bg-gray-50 rounded-lg p-4\">
          <p className=\"text-sm text-gray-600\">Current Stock</p>
          <p className=\"text-3xl font-bold text-gray-900\">{product.quantity}</p>
        </div>

        <form onSubmit={handleSubmit} className=\"space-y-6\">
          <div>
            <label className=\"block text-sm font-medium text-gray-700 mb-2\">Adjustment Type</label>
            <div className=\"grid grid-cols-2 gap-4\">
              <button
                type=\"button\"
                onClick={() => setAdjustmentType('add')}
                className={\lex items-center justify-center gap-2 px-4 py-3 border-2 rounded-lg transition \\}
              >
                <Plus className=\"w-5 h-5\" />
                Add Stock
              </button>
              <button
                type=\"button\"
                onClick={() => setAdjustmentType('remove')}
                className={\lex items-center justify-center gap-2 px-4 py-3 border-2 rounded-lg transition \\}
              >
                <Minus className=\"w-5 h-5\" />
                Remove Stock
              </button>
            </div>
          </div>

          <div>
            <label className=\"block text-sm font-medium text-gray-700 mb-2\">Quantity</label>
            <input
              type=\"number\"
              min=\"1\"
              value={adjustment}
              onChange={(e) => setAdjustment(e.target.value)}
              className=\"w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500\"
              placeholder=\"Enter quantity\"
            />
          </div>

          <div>
            <label className=\"block text-sm font-medium text-gray-700 mb-2\">Reason <span className=\"text-red-500\">*</span></label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className=\"w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500\"
              placeholder=\"e.g., Stock received, Damage, Sale, etc.\"
              rows={3}
            />
          </div>

          <div className=\"bg-blue-50 border border-blue-200 rounded-lg p-4\">
            <p className=\"text-sm text-gray-700\">
              New Stock: <span className={\	ext-xl font-bold \\}>{newQuantity}</span>
            </p>
            {newQuantity < 0 && <p className=\"text-xs text-red-600 mt-1\">Cannot have negative stock</p>}
          </div>

          <div className=\"flex items-center gap-4 pt-4 border-t border-gray-200\">
            <button
              type=\"submit\"
              disabled={isSubmitting || newQuantity < 0 || !reason.trim()}
              className=\"px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed\"
            >
              {isSubmitting ? 'Adjusting...' : 'Adjust Stock'}
            </button>
            <Link href=\"/products\" className=\"px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50\">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}