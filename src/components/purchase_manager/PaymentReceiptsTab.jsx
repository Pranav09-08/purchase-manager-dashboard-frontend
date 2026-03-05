import { useState } from 'react';

// Payment receipts view for purchase manager
function PaymentReceiptsTab({ receipts = [], invoices = [], payments = [], orderLookup = {}, vendorLookup = {} }) {
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  
  const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;
  const formatDate = (value) => (value ? new Date(value).toLocaleDateString() : '—');
  const isUrl = (value) => /^https?:\/\//i.test(value || '');
  
  // Get invoice for a payment
  const getInvoiceForPayment = (payment) => {
    return invoices.find(inv => String(inv.order_id) === String(payment.order_id));
  };
  
  // Check if invoice is fully paid
  const isInvoiceClosed = (payment) => {
    const invoice = getInvoiceForPayment(payment);
    if (!invoice) return false;
    
    const totalAmount = Number(invoice.total_amount || 0);
    const totalPaid = (payments || [])
      .filter(p => String(p.order_id) === String(payment.order_id) && p.status !== 'failed')
      .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
    
    return totalPaid >= totalAmount - 0.01;
  };

  return (
    <div>
      <div className="flex flex-col gap-2 mb-6">
        <h2 className="text-2xl font-semibold text-slate-900">Payment Receipts</h2>
        <p className="text-sm text-slate-500">View all payments received and their receipts from vendors.</p>
      </div>
      
      {receipts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
          <p className="text-slate-600">No receipts received yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {receipts.map((payment) => {
            const invoice = getInvoiceForPayment(payment);
            const isClosed = isInvoiceClosed(payment);
            
            return (
              <div
                key={payment.payment_id}
                onClick={() => setSelectedReceipt(payment)}
                className="bg-white rounded-xl border border-slate-200 px-4 py-3 hover:border-slate-400 hover:shadow-md hover:bg-slate-50 transition cursor-pointer"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900">
                      {orderLookup[payment.order_id] || 'Order'} {invoice && `- Invoice ${invoice.invoice_number}`}
                    </p>
                    <p className="text-xs text-slate-500">Vendor: {vendorLookup[payment.vendor_id] || 'Vendor'}</p>
                    <p className="text-xs text-slate-500">Phase: {payment.phase || '—'}</p>
                    <p className="text-xs text-slate-500">Paid: {formatDate(payment.payment_date)}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 justify-between sm:justify-end">
                    <span className="text-sm font-semibold text-slate-900">{formatCurrency(payment.amount)}</span>
                    {isClosed && (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                        Invoice Closed ✓
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {selectedReceipt && (() => {
        const invoice = getInvoiceForPayment(selectedReceipt);
        const isClosed = isInvoiceClosed(selectedReceipt);
        
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
            <div className="w-full max-w-3xl rounded-2xl bg-white shadow-lg max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
                <div>
                  <p className="text-xs text-slate-500 uppercase">Payment Receipt</p>
                  <h2 className="text-xl font-semibold text-slate-900">
                    {orderLookup[selectedReceipt.order_id] || 'Order'}
                  </h2>
                  {invoice && (
                    <p className="text-xs text-slate-500 mt-1">Invoice: {invoice.invoice_number}</p>
                  )}
                </div>
                <button
                  onClick={() => setSelectedReceipt(null)}
                  className="text-slate-400 hover:text-slate-600 transition"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3">
                    <p className="text-xs text-slate-500 font-semibold mb-1">Amount</p>
                    <p className="text-lg font-bold text-slate-900">{formatCurrency(selectedReceipt.amount)}</p>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3">
                    <p className="text-xs text-slate-500 font-semibold mb-1">Phase</p>
                    <p className="text-sm font-semibold text-slate-900 capitalize">{selectedReceipt.phase || '—'}</p>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3">
                    <p className="text-xs text-slate-500 font-semibold mb-1">Payment Date</p>
                    <p className="text-sm font-semibold text-slate-900">{formatDate(selectedReceipt.payment_date)}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3">
                    <p className="text-xs text-slate-500 font-semibold mb-1">Vendor</p>
                    <p className="text-sm font-semibold text-slate-900">{vendorLookup[selectedReceipt.vendor_id] || 'Vendor'}</p>
                  </div>
                  {invoice && (
                    <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3">
                      <p className="text-xs text-slate-500 font-semibold mb-1">Invoice</p>
                      <p className="text-sm font-semibold text-slate-900">{invoice.invoice_number}</p>
                    </div>
                  )}
                </div>
                
                {selectedReceipt.notes && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
                    <p className="text-xs text-blue-600 font-semibold mb-2">Receipt Message / Reference</p>
                    {isUrl(selectedReceipt.notes) ? (
                      <a
                        href={selectedReceipt.notes}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-700 font-semibold underline break-all"
                      >
                        {selectedReceipt.notes}
                      </a>
                    ) : (
                      <p className="text-sm text-blue-900 whitespace-pre-wrap">{selectedReceipt.notes}</p>
                    )}
                  </div>
                )}
                
                {isClosed && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">✓</span>
                      <div>
                        <p className="font-semibold text-emerald-900">Invoice Closed & Settled</p>
                        <p className="text-xs text-emerald-700">All payments received. Invoice is now closed.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="sticky bottom-0 flex justify-end gap-3 border-t border-slate-200 bg-white px-6 py-4">
                <button
                  onClick={() => setSelectedReceipt(null)}
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

export default PaymentReceiptsTab;
