import { useMemo, useState } from 'react';

// Read-only product list for purchase manager
function ProductsTab({ 
  products = [], 
  onSelectProduct = () => {}, 
  onViewVendors = () => {},
  onCreateProduct = () => {}
}) {
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    item_no: '',
    description: '',
    size: '',
    stock: 0,
    active: true,
  });

  const sortedProducts = useMemo(
    () => [...products].sort((a, b) => (a.title || '').localeCompare(b.title || '')),
    [products]
  );

  const resetForm = () => {
    setForm({
      title: '',
      item_no: '',
      description: '',
      size: '',
      stock: 0,
      active: true,
    });
  };

  const openCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.item_no.trim()) {
      alert('Title and item number are required');
      return;
    }

    setSaving(true);
    const payload = {
      title: form.title.trim(),
      item_no: form.item_no.trim(),
      description: form.description?.trim() || null,
      size: form.size?.trim() || null,
      stock: Number(form.stock || 0),
      active: !!form.active,
    };

    try {
      await onCreateProduct(payload);
      setShowForm(false);
      resetForm();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={openCreate}
          className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800"
        >
          Add Product
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900">Add Product</h3>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
              className="text-sm font-semibold text-slate-600 hover:text-slate-900"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Product title"
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg"
              required
            />
            <input
              type="text"
              placeholder="Item number"
              value={form.item_no}
              onChange={(e) => setForm((prev) => ({ ...prev, item_no: e.target.value }))}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg"
              required
            />
            <input
              type="text"
              placeholder="Size"
              value={form.size}
              onChange={(e) => setForm((prev) => ({ ...prev, size: e.target.value }))}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg"
            />
            <input
              type="number"
              placeholder="Stock"
              value={form.stock}
              onChange={(e) => setForm((prev) => ({ ...prev, stock: e.target.value }))}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg"
            />
          </div>

          <textarea
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg"
            rows={3}
          />

          <label className="inline-flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={!!form.active}
              onChange={(e) => setForm((prev) => ({ ...prev, active: e.target.checked }))}
            />
            Active
          </label>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Create Product'}
            </button>
          </div>
        </form>
      )}

      {products.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-sm">
          <div className="text-5xl mb-4">📦</div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">No Products Found</h3>
          <p className="text-slate-600">Products will appear here once created.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {sortedProducts.map((product) => (
            <div key={product.productId || product.productid} className="data-card flex flex-col gap-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h4 className="data-title break-words">{product.title}</h4>
                  <p className="data-subtitle break-words">{product.item_no ? `Item No: ${product.item_no}` : 'Company product'}</p>
                </div>
                <span className={`data-pill ${product.active ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                  {product.active ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="data-grid">
                <div className="data-kv">
                  <span className="data-label">Item No</span>
                  <span className="data-value">{product.item_no || '—'}</span>
                </div>
                <div className="data-kv">
                  <span className="data-label">Size</span>
                  <span className="data-value">{product.size || '—'}</span>
                </div>
                <div className="data-kv">
                  <span className="data-label">Stock</span>
                  <span className="data-value">{product.stock ?? 0}</span>
                </div>
              </div>

              <div className="mt-4">
                <button
                  onClick={() => onSelectProduct(product)}
                  className="w-full px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800"
                >
                  Components
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ProductsTab;
