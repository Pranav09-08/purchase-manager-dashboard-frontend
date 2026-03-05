
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import DashboardLayout from '../DashboardLayout';
import OverviewTab from './OverviewTab';
import VendorAnalyticsTab from './VendorAnalyticsTab';
import ComponentsTab from './ComponentsTab';
import EnquiriesTab from './EnquiriesTab';
import QuotationsTab from './QuotationsTab';
import LoisTab from './LoisTab';
import OrdersTab from './OrdersTab';
import PaymentsTab from './PaymentsTab';
import InvoicesTab from './InvoicesTab';
import AddComponentModal from './AddComponentModal';

// Import vendor APIs
import authApi from '../../api/auth.api';
import { listVendorComponents, createVendorComponent, updateVendorComponent, deleteVendorComponent, listAllComponents } from '../../api/vendor/components.api';
import { listVendorEnquiries } from '../../api/vendor/enquiries.api';
import { listVendorOrders, confirmVendorOrder, getVendorOrder } from '../../api/vendor/orders.api';
import { listVendorInvoices, createVendorInvoice } from '../../api/vendor/invoices.api';
import { listVendorQuotations, createVendorQuotation } from '../../api/vendor/quotations.api';
import { listVendorCounterQuotations, respondToCounterQuotation } from '../../api/vendor/counterQuotations.api';
import { listVendorLois, vendorLoiAction } from '../../api/vendor/lois.api';
import { listVendorPayments, vendorPaymentReceipt } from '../../api/vendor/payments.api';

const tabComponents = {
  overview: OverviewTab,
  analytics: VendorAnalyticsTab,
  components: ComponentsTab,
  enquiries: EnquiriesTab,
  quotations: QuotationsTab,
  lois: LoisTab,
  orders: OrdersTab,
  payments: PaymentsTab,
  invoices: InvoicesTab,
};

function VendorDashboard(props) {
  const { currentUser, idToken, getIdToken, loading: authLoading } = useAuth();
  const [currentPage, setCurrentPage] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [vendor, setVendor] = useState(null);
  
  // Data states
  const [components, setComponents] = useState([]);
  const [allComponents, setAllComponents] = useState([]); // Master component catalog for lookups
  const [enquiries, setEnquiries] = useState([]);
  const [orders, setOrders] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [counters, setCounters] = useState([]);
  const [lois, setLois] = useState([]);
  const [payments, setPayments] = useState([]);

  // Component form states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingComponent, setEditingComponent] = useState(null);
  const [componentFormData, setComponentFormData] = useState({
    componentName: '',
    category: '',
    subcategory: '',
    specifications: '',
    pricePerUnit: '',
    gst: '',
    cgst: '',
    sgst: '',
    unitOfMeasurement: '',
    minimumOrderQuantity: '',
    leadTimeDays: '',
  });

  // Quotation form states
  const [quotationForm, setQuotationForm] = useState({
    enquiryId: '',
    validTill: '',
    expectedDeliveryDate: '',
    advancePaymentPercent: 0,
    termsAndConditions: '',
    notes: '',
  });
  const [quotationItems, setQuotationItems] = useState([]);

  // Counter quotation form states
  const [counterForm, setCounterForm] = useState({
    quotationId: '',
    validTill: '',
    expectedDeliveryDate: '',
    advancePaymentPercent: 0,
    termsAndConditions: '',
    notes: '',
  });
  const [counterItems, setCounterItems] = useState([]);

  // Invoice form states
  const [invoiceForm, setInvoiceForm] = useState({
    orderId: '',
    loiId: '',
    companyId: '',
    invoiceNumber: '',
    invoiceDate: '',
    dueDate: '',
    termsAndConditions: '',
    advancePaymentPercent: '',
    notes: '',
  });
  const [invoiceItems, setInvoiceItems] = useState([]);

  // Fetch vendor profile
  useEffect(() => {
    const fetchVendorProfile = async () => {
      if (!currentUser || !idToken) return;
      
      try {
        const token = idToken || await getIdToken();
        const response = await authApi.getOwnVendorProfile(token);
        // Backend returns { supplier: data }
        const vendorData = response.data.supplier || response.data.vendor || response.data;
        setVendor(vendorData);
      } catch (error) {
        // Fallback to localStorage vendor data
        try {
          const storedVendor = JSON.parse(localStorage.getItem('vendor'));
          if (storedVendor) {
            setVendor(storedVendor);
          } else {
            setVendor(currentUser);
          }
        } catch {
          setVendor(currentUser);
        }
      }
    };

    fetchVendorProfile();
  }, [currentUser, idToken]);

  // Fetch all vendor data
  useEffect(() => {
    const fetchData = async () => {
      if (!vendor || authLoading) return;
      
      try {
        setLoading(true);
        
        // Ensure we have a valid token before proceeding
        let token = idToken;
        if (!token) {
          token = await getIdToken(true); // Force refresh
        }
        
        // Validate token format (should be a JWT with 3 parts)
        if (!token || token.split('.').length !== 3) {
          throw new Error('Invalid authentication token');
        }
        
        const vendorId = vendor.vendor_id || vendor.vendorId || vendor.uid;
        
        if (!vendorId) {
          throw new Error('Vendor ID not found');
        }
        
        // Fetch all data in parallel
        const [
          componentsData,
          allComponentsData,
          enquiriesData,
          ordersData,
          invoicesData,
          quotationsData,
          countersData,
          loisData,
          paymentsData,
        ] = await Promise.all([
          listVendorComponents(token).catch(() => ({ products: [] })),
          listAllComponents(token).catch(() => ({ components: [] })),
          listVendorEnquiries(token, vendorId).catch(() => ({ enquiries: [] })),
          listVendorOrders(token, vendorId).catch(() => ({ orders: [] })),
          listVendorInvoices(token, vendorId).catch(() => ({ invoices: [] })),
          listVendorQuotations(token, vendorId).catch(() => ({ quotations: [] })),
          listVendorCounterQuotations(token, vendorId).catch(() => ({ counters: [] })),
          listVendorLois(token, vendorId).catch(() => ({ lois: [] })),
          listVendorPayments(token, vendorId).catch(() => ({ payments: [] })),
        ]);

        setComponents(componentsData.products || componentsData.components || []);
        setAllComponents(allComponentsData.components || []);
        setEnquiries(enquiriesData.enquiries || []);
        setOrders(ordersData.orders || []);
        setInvoices(invoicesData.invoices || []);
        setQuotations(quotationsData.quotations || []);
        setCounters(countersData.counters || []);
        setLois(loisData.lois || []);
        setPayments(paymentsData.payments || []);
      } catch (error) {
        // Error handled, data set to empty arrays
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [vendor, authLoading, idToken]);

  useEffect(() => {
    const handler = (e) => {
      if (e.detail && e.detail.page) {
        setCurrentPage(e.detail.page);
      }
    };
    window.addEventListener('dashboardPageChange', handler);
    return () => window.removeEventListener('dashboardPageChange', handler);
  }, []);

  // Component management handlers
  const handleOpenAddModal = () => {
    setEditingComponent(null);
    setComponentFormData({
      componentName: '',
      category: '',
      subcategory: '',
      specifications: '',
      pricePerUnit: '',
      gst: '',
      cgst: '',
      sgst: '',
      unitOfMeasurement: '',
      minimumOrderQuantity: '',
      leadTimeDays: '',
    });
    setShowAddModal(true);
  };

  const handleEditComponent = (component) => {
    setEditingComponent(component);
    setComponentFormData({
      componentName: component.component_name || component.name || '',
      category: component.category || '',
      subcategory: component.subcategory || '',
      specifications: component.specifications || '',
      pricePerUnit: component.price_per_unit || component.pricePerUnit || '',
      gst: component.gst || '',
      cgst: component.cgst || '',
      sgst: component.sgst || '',
      unitOfMeasurement: component.unit_of_measurement || component.unit || '',
      minimumOrderQuantity: component.minimum_order_quantity || component.moq || '',
      leadTimeDays: component.lead_time_days || component.leadTime || '',
    });
    setShowAddModal(true);
  };

  const handleDeleteComponent = async (componentId) => {
    if (!window.confirm('Are you sure you want to delete this component?')) return;
    
    try {
      const token = idToken || await getIdToken();
      await deleteVendorComponent(token, componentId);
      alert('Component deleted successfully');
      
      // Refresh components list
      const data = await listVendorComponents(token);
      setComponents(data.products || data.components || []);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete component');
    }
  };

  const handleComponentInputChange = (e) => {
    const { name, value } = e.target;
    setComponentFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleComponentSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const token = idToken || await getIdToken();
      const payload = {
        componentName: componentFormData.componentName,
        category: componentFormData.category,
        subcategory: componentFormData.subcategory,
        specifications: componentFormData.specifications,
        pricePerUnit: Number(componentFormData.pricePerUnit),
        gst: Number(componentFormData.gst) || 0,
        cgst: Number(componentFormData.cgst) || 0,
        sgst: Number(componentFormData.sgst) || 0,
        unitOfMeasurement: componentFormData.unitOfMeasurement,
        minimumOrderQuantity: Number(componentFormData.minimumOrderQuantity) || 1,
        leadTimeDays: Number(componentFormData.leadTimeDays) || 0,
      };

      if (editingComponent) {
        const componentId = editingComponent.componentid || editingComponent.id;
        await updateVendorComponent(token, componentId, payload);
        alert('Component updated successfully');
      } else {
        await createVendorComponent(token, payload);
        alert('Component added successfully');
      }

      setShowAddModal(false);
      setEditingComponent(null);
      
      // Refresh components list
      const data = await listVendorComponents(token);
      setComponents(data.products || data.components || []);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save component');
    }
  };

  const handleComponentAdded = async () => {
    try {
      const token = idToken || await getIdToken();
      const data = await listVendorComponents(token);
      setComponents(data.products || data.components || []);
    } catch (err) {
      // Silently fail component refresh
    }
  };

  // Enquiry handlers
  const handleRejectEnquiry = async (enquiry) => {
    // Refresh enquiries list after rejection
    try {
      const token = idToken || await getIdToken();
      const vendorId = vendor.vendor_id || vendor.vendorId || vendor.uid;
      const data = await listVendorEnquiries(token, vendorId);
      setEnquiries(data.enquiries || []);
    } catch (err) {
      // Silently fail enquiry refresh
    }
  };

  const handleEnquiryCreated = async (enquiry) => {
    // Refresh enquiries list after creation
    try {
      const token = idToken || await getIdToken();
      const vendorId = vendor.vendor_id || vendor.vendorId || vendor.uid;
      const data = await listVendorEnquiries(token, vendorId);
      setEnquiries(data.enquiries || []);
    } catch (err) {
      // Silently fail enquiry refresh
    }
  };

  const formatDateForInput = (value) => {
    if (!value) return '';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '';
    return parsed.toISOString().split('T')[0];
  };

  const addDaysForInput = (days) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  };

  const resolveNumber = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  const buildQuotationItemsFromEnquiry = (enquiry) => {
    if (!enquiry?.items?.length) return [];

    const resolveComponentId = (item) => item.component_id || item.componentId || item.componentid;
    const allComps = [...components, ...allComponents];

    return enquiry.items.map((item) => {
      const enquiryComponentId = resolveComponentId(item);
      const component = allComps.find((c) => (
        String(c.componentId || c.componentid || c.component_id || c.id) === String(enquiryComponentId)
      ));

      return {
        componentId: enquiryComponentId,
        name: item.component_name || component?.component_name || component?.name || 'Component',
        quantity: resolveNumber(item.quantity, 1),
        unit: item.unit || component?.unit_of_measurement || component?.measurement_unit || component?.unit || '',
        specifications: item.specifications || item.specification || '',
        unitPrice: resolveNumber(
          item.estimated_unit_cost
            ?? item.unit_price
            ?? item.unitPrice
            ?? component?.price_per_unit
            ?? component?.unit_price
            ?? component?.cost_per_unit,
          0
        ),
        discountPercent: resolveNumber(
          item.discount_percent
            ?? item.discount
            ?? item.discountPercent
            ?? component?.discount_percent
            ?? component?.discountPercent
            ?? component?.discount,
          0
        ),
        cgstPercent: resolveNumber(
          item.cgst
            ?? item.cgst_percent
            ?? item.cgstPercent
            ?? component?.cgst
            ?? component?.cgst_percent,
          0
        ),
        sgstPercent: resolveNumber(
          item.sgst
            ?? item.sgst_percent
            ?? item.sgstPercent
            ?? component?.sgst
            ?? component?.sgst_percent,
          0
        ),
      };
    });
  };

  const handleCreateQuotation = (enquiry) => {
    // Switch to quotations tab and pre-fill form
    setCurrentPage('quotations');
    if (enquiry) {
      const deliveryDate = formatDateForInput(enquiry.required_delivery_date || enquiry.requiredDeliveryDate);
      const defaultValidTill = deliveryDate || addDaysForInput(7);
      
      setQuotationForm({
        enquiryId: enquiry.enquiry_id || enquiry.id,
        validTill: defaultValidTill,
        expectedDeliveryDate: deliveryDate,
        advancePaymentPercent: 0,
        termsAndConditions: '',
        notes: `Quotation for ${enquiry.title || 'Purchase Enquiry'}`,
      });

      setQuotationItems(buildQuotationItemsFromEnquiry(enquiry));
    }
  };

  // Quotation handlers
  const handleSelectEnquiry = (enquiryId) => {
    const enquiry = enquiries.find(e => String(e.enquiry_id || e.id) === String(enquiryId));
    if (enquiry) {
      const deliveryDate = formatDateForInput(enquiry.required_delivery_date || enquiry.requiredDeliveryDate);
      const defaultValidTill = deliveryDate || addDaysForInput(7);
      
      setQuotationForm(prev => ({
        ...prev,
        enquiryId: enquiryId,
        validTill: prev.validTill || defaultValidTill,
        expectedDeliveryDate: deliveryDate,
        notes: `Quotation for ${enquiry.title || 'Purchase Enquiry'}`,
      }));

      setQuotationItems(buildQuotationItemsFromEnquiry(enquiry));
    }
  };

  const handleQuotationInputChange = (e) => {
    const { name, value } = e.target;
    setQuotationForm(prev => ({ ...prev, [name]: value }));
  };

  const handleQuotationItemAdd = () => {
    setQuotationItems(prev => [...prev, {
      componentId: '',
      quantity: 1,
      unitPrice: 0,
      cgstPercent: 0,
      sgstPercent: 0,
      specifications: '',
    }]);
  };

  const handleQuotationItemRemove = (index) => {
    setQuotationItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleQuotationItemChange = (index, field, value) => {
    setQuotationItems(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const handleQuotationSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const token = idToken || await getIdToken(true);
      const vendorId = vendor.vendor_id || vendor.vendorId || vendor.uid;
      
      const payload = {
        enquiryId: quotationForm.enquiryId,
        vendorId: vendorId,
        validTill: quotationForm.validTill,
        expectedDeliveryDate: quotationForm.expectedDeliveryDate,
        advancePaymentPercent: quotationForm.advancePaymentPercent || 0,
        termsAndConditions: quotationForm.termsAndConditions || '',
        notes: quotationForm.notes || '',
        items: quotationItems.map((item) => {
          const quantity = Number(item.quantity) || 0;
          const unitPrice = Number(item.unitPrice) || 0;
          return {
            ...item,
            quantity,
            unitPrice,
            discountPercent: Number(item.discountPercent) || 0,
            cgstPercent: Number(item.cgstPercent) || 0,
            sgstPercent: Number(item.sgstPercent) || 0,
            lineTotal: quantity * unitPrice,
          };
        }),
      };

      await createVendorQuotation(token, payload);
      
      // Clear form
      setQuotationForm({
        enquiryId: '',
        validTill: '',
        expectedDeliveryDate: '',
        advancePaymentPercent: 0,
        termsAndConditions: '',
        notes: '',
      });
      setQuotationItems([]);
      
      // Refresh quotations
      const data = await listVendorQuotations(token, vendorId);
      setQuotations(data.quotations || []);
      
      alert('Quotation submitted successfully');
    } catch (err) {
      alert(err.response?.data?.error || err.message || 'Failed to submit quotation');
    }
  };

  // Counter quotation handlers (similar pattern)
  const handleCounterInputChange = (e) => {
    const { name, value } = e.target;
    setCounterForm(prev => ({ ...prev, [name]: value }));
  };

  const handleCounterItemAdd = () => {
    setCounterItems(prev => [...prev, {
      componentId: '',
      quantity: 1,
      unitPrice: 0,
      cgstPercent: 0,
      sgstPercent: 0,
      specifications: '',
    }]);
  };

  const handleCounterItemRemove = (index) => {
    setCounterItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleCounterItemChange = (index, field, value) => {
    setCounterItems(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const handleCounterSubmit = async (e) => {
    e.preventDefault();
    alert('Counter quotation feature coming soon');
  };

  // LOI handlers
  const handleLoiAccept = async (loiId) => {
    try {
      const token = idToken || await getIdToken(true);
      await vendorLoiAction(token, loiId, 'accept');
      
      // Refresh LOIs
      const vendorId = vendor.vendor_id || vendor.vendorId || vendor.uid;
      const data = await listVendorLois(token, vendorId);
      setLois(data.lois || []);
      
      alert('LOI accepted successfully');
    } catch (err) {
      alert(err.response?.data?.error || err.message || 'Failed to accept LOI');
    }
  };

  const handleLoiReject = async (loiId) => {
    try {
      const token = idToken || await getIdToken(true);
      await vendorLoiAction(token, loiId, 'reject');
      
      // Refresh LOIs
      const vendorId = vendor.vendor_id || vendor.vendorId || vendor.uid;
      const data = await listVendorLois(token, vendorId);
      setLois(data.lois || []);
      
      alert('LOI rejected successfully');
    } catch (err) {
      alert(err.response?.data?.error || err.message || 'Failed to reject LOI');
    }
  };

  const handleGoToLois = () => {
    setCurrentPage('lois');
  };

  const handleGoToOrders = () => {
    setCurrentPage('orders');
  };

  const handleGoToInvoices = async (order) => {
    const orderId = order.order_id || order.orderId;
    
    try {
      // Fetch full order details including items
      const token = idToken || await getIdToken(true);
      const orderData = await getVendorOrder(token, orderId);
      
      const fullOrder = orderData.order || order;
      
      // Pre-fill invoice form with order details
      setInvoiceForm({
        orderId: orderId || '',
        loiId: fullOrder.loi_id || fullOrder.loiId || '',
        companyId: fullOrder.company_id || fullOrder.companyId || '',
        invoiceNumber: '', // Let vendor fill this
        invoiceDate: new Date().toISOString().split('T')[0],
        dueDate: '', // Let vendor fill this
        termsAndConditions: fullOrder.terms_and_conditions || fullOrder.termsAndConditions || '',
        advancePaymentPercent: '',
        notes: '',
      });
      
      // Pre-fill invoice items from order items
      const items = fullOrder.items || [];
      const invoiceItemsData = items.map(item => ({
        componentId: item.component_id || item.componentId || '',
        description: item.component_name || item.description || '',
        quantity: item.quantity || 1,
        unitPrice: item.unit_price || item.unitPrice || 0,
        discountPercent: item.discount_percent || item.discountPercent || 0,
        cgstPercent: item.cgst_percent || item.cgstPercent || 0,
        sgstPercent: item.sgst_percent || item.sgstPercent || 0,
        lineTotal: ((item.quantity || 1) * (item.unit_price || item.unitPrice || 0) * (1 - (item.discount_percent || item.discountPercent || 0) / 100)),
      }));
      
      setInvoiceItems(invoiceItemsData);
    } catch (error) {
      console.error('Error fetching order details:', error);
      
      // If fetch fails, still pre-fill from the passed order object
      setInvoiceForm({
        orderId: orderId || '',
        loiId: order.loi_id || order.loiId || '',
        companyId: order.company_id || order.companyId || '',
        invoiceNumber: '',
        invoiceDate: new Date().toISOString().split('T')[0],
        dueDate: '',
        termsAndConditions: order.terms_and_conditions || order.termsAndConditions || '',
        advancePaymentPercent: '',
        notes: '',
      });
      
      // Try to get items from order if available
      const items = order.items || [];
      if (items.length > 0) {
        const invoiceItemsData = items.map(item => ({
          componentId: item.component_id || item.componentId || '',
          description: item.component_name || item.description || '',
          quantity: item.quantity || 1,
          unitPrice: item.unit_price || item.unitPrice || 0,
          discountPercent: item.discount_percent || item.discountPercent || 0,
          cgstPercent: item.cgst_percent || item.cgstPercent || 0,
          sgstPercent: item.sgst_percent || item.sgstPercent || 0,
          lineTotal: ((item.quantity || 1) * (item.unit_price || item.unitPrice || 0) * (1 - (item.discount_percent || item.discountPercent || 0) / 100)),
        }));
        setInvoiceItems(invoiceItemsData);
      }
    }
    
    setCurrentPage('invoices');
  };

  const handleGoToPayments = () => {
    setCurrentPage('payments');
  };

  // Order handlers
  const handleConfirmOrder = async (orderId) => {
    try {
      const token = idToken || await getIdToken(true);
      await confirmVendorOrder(token, orderId);
      
      // Refresh orders
      const vendorId = vendor.vendor_id || vendor.vendorId || vendor.uid;
      const data = await listVendorOrders(token, vendorId);
      setOrders(data.orders || []);
      
      alert('Order confirmed successfully');
    } catch (err) {
      alert(err.response?.data?.error || err.message || 'Failed to confirm order');
    }
  };

  const handleViewInvoice = (invoice) => {
    setCurrentPage('invoices');
    // Could scroll to invoice or highlight it
  };

  const handleEditInvoice = (invoice) => {
    setCurrentPage('invoices');
    // Pre-fill invoice form
  };

  // Invoice handlers
  const handleInvoiceInputChange = (e) => {
    const { name, value } = e.target;
    setInvoiceForm(prev => ({ ...prev, [name]: value }));
  };

  const handleInvoiceAddItem = () => {
    setInvoiceItems(prev => [...prev, {
      componentId: '',
      description: '',
      quantity: 1,
      unitPrice: 0,
      cgstPercent: 0,
      sgstPercent: 0,
    }]);
  };

  const handleInvoiceRemoveItem = (index) => {
    setInvoiceItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleInvoiceItemChange = (index, field, value) => {
    setInvoiceItems(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const handleInvoiceSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const token = idToken || await getIdToken(true);
      const vendorId = vendor.vendor_id || vendor.vendorId || vendor.uid;
      
      const payload = {
        orderId: invoiceForm.orderId,
        loiId: invoiceForm.loiId,
        companyId: invoiceForm.companyId,
        vendorId: vendorId,
        invoiceNumber: invoiceForm.invoiceNumber,
        invoiceDate: invoiceForm.invoiceDate,
        dueDate: invoiceForm.dueDate,
        termsAndConditions: invoiceForm.termsAndConditions || '',
        advancePaymentPercent: invoiceForm.advancePaymentPercent || 0,
        notes: invoiceForm.notes || '',
        items: invoiceItems,
      };

      await createVendorInvoice(token, payload);
      
      // Clear form
      setInvoiceForm({
        orderId: '',
        loiId: '',
        companyId: '',
        invoiceNumber: '',
        invoiceDate: '',
        dueDate: '',
        termsAndConditions: '',
        advancePaymentPercent: '',
        notes: '',
      });
      setInvoiceItems([]);
      
      // Refresh invoices
      const data = await listVendorInvoices(token, vendorId);
      setInvoices(data.invoices || []);
      
      alert('Invoice created successfully');
    } catch (err) {
      alert(err.response?.data?.error || err.message || 'Failed to create invoice');
    }
  };

  // Payment handlers
  const handleConfirmPaymentReceived = async (paymentId, receiptMessage = '') => {
    try {
      const token = idToken || await getIdToken(true);
      await vendorPaymentReceipt(token, paymentId, receiptMessage);
      
      // Refresh payments
      const vendorId = vendor.vendor_id || vendor.vendorId || vendor.uid;
      const data = await listVendorPayments(token, vendorId);
      setPayments(data.payments || []);
      
      alert('Payment receipt sent successfully');
    } catch (err) {
      alert(err.response?.data?.error || err.message || 'Failed to send payment receipt');
    }
  };

  const TabComponent = tabComponents[currentPage] || OverviewTab;

  // Calculate notification counts
  const seenEnquiryIds = (() => {
    try {
      return JSON.parse(localStorage.getItem('vendorEnquirySeen') || '[]');
    } catch {
      return [];
    }
  })();

  const enquiriesCount = enquiries.filter(
    (e) => ['raised', 'pending', 'new'].includes(e.status) && !seenEnquiryIds.includes(e.enquiry_id)
  ).length;

  const loisCount = lois.filter((loi) => loi.status === 'sent').length;
  const ordersCount = orders.filter((o) => o.status === 'pending').length;
  const invoicesCount = invoices.filter((inv) => inv.status === 'pending').length;

  // Prepare user profile data
  const displayName = vendor?.company_name || vendor?.contact_person || 'Vendor';
  const displayEmail = vendor?.contact_email || currentUser?.email || '';

  if (authLoading || loading) {
    return (
      <DashboardLayout 
        userType="vendor" 
        currentPage={currentPage}
        userName={displayName}
        userProfile={{
          name: displayName,
          role: 'Vendor',
          email: displayEmail,
          company: vendor?.company_name || '',
        }}
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-600">Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout 
      userType="vendor" 
      currentPage={currentPage}
      userName={displayName}
      userProfile={{
        name: displayName,
        role: 'Vendor',
        email: displayEmail,
        company: vendor?.company_name || '',
      }}
      enquiriesCount={enquiriesCount}
      loisCount={loisCount}
      ordersCount={ordersCount}
      invoicesCount={invoicesCount}
    >
      <TabComponent 
        {...props}
        vendor={vendor}
        components={components}
        componentCatalog={[...components, ...allComponents]}
        enquiries={enquiries}
        purchaseEnquiries={enquiries}
        purchaseOrders={orders}
        orders={orders}
        vendorInvoices={invoices}
        invoices={invoices}
        quotations={quotations}
        purchaseQuotations={quotations}
        counters={counters}
        lois={lois}
        payments={payments}
        onOpenAddModal={handleOpenAddModal}
        onEditComponent={handleEditComponent}
        onDeleteComponent={handleDeleteComponent}
        onComponentAdded={handleComponentAdded}
        onRejectEnquiry={handleRejectEnquiry}
        onEnquiryCreated={handleEnquiryCreated}
        onCreateQuotation={handleCreateQuotation}
        quotationForm={quotationForm}
        quotationItems={quotationItems}
        onSelectEnquiry={handleSelectEnquiry}
        onQuotationInputChange={handleQuotationInputChange}
        onQuotationItemAdd={handleQuotationItemAdd}
        onQuotationItemRemove={handleQuotationItemRemove}
        onQuotationItemChange={handleQuotationItemChange}
        onQuotationSubmit={handleQuotationSubmit}
        counterForm={counterForm}
        counterItems={counterItems}
        onCounterInputChange={handleCounterInputChange}
        onCounterItemAdd={handleCounterItemAdd}
        onCounterItemRemove={handleCounterItemRemove}
        onCounterItemChange={handleCounterItemChange}
        onCounterSubmit={handleCounterSubmit}
        onGoToLois={handleGoToLois}
        onAccept={handleLoiAccept}
        onReject={handleLoiReject}
        onGoToOrders={handleGoToOrders}
        onGoToInvoices={handleGoToInvoices}
        onConfirm={handleConfirmOrder}
        onViewInvoice={handleViewInvoice}
        onEditInvoice={handleEditInvoice}
        invoiceForm={invoiceForm}
        invoiceItems={invoiceItems}
        formData={invoiceForm}
        items={invoiceItems}
        componentLookup={components}
        onInputChange={handleInvoiceInputChange}
        onAddItem={handleInvoiceAddItem}
        onRemoveItem={handleInvoiceRemoveItem}
        onItemChange={handleInvoiceItemChange}
        onSubmit={handleInvoiceSubmit}
        onGoToPayments={handleGoToPayments}
        onConfirmReceived={handleConfirmPaymentReceived}
      />
      
      <AddComponentModal
        isOpen={showAddModal}
        editingComponent={editingComponent}
        formData={componentFormData}
        onInputChange={handleComponentInputChange}
        onSubmit={handleComponentSubmit}
        onClose={() => {
          setShowAddModal(false);
          setEditingComponent(null);
        }}
      />
    </DashboardLayout>
  );
}

export default VendorDashboard;
