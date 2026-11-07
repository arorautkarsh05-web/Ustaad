import React, { useState, useEffect } from 'react';
import { toolbankApi } from '../../api/toolbank.api';
import { adminApi } from '../../api/admin.api';
import { useToast } from '../../context/ToastContext';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  Wrench,
  Plus,
  Coins,
  Calendar,
  Layers,
  Edit,
} from 'lucide-react';

export const AdminToolBankPage = () => {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState('basic_tools');
  const [description, setDescription] = useState('');
  const [creditReq, setCreditReq] = useState(20);
  const [quantity, setQuantity] = useState(5);
  const [accessType, setAccessType] = useState('individual');
  const [maxDays, setMaxDays] = useState(7);
  const [saving, setSaving] = useState(false);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await toolbankApi.getItems();
      if (res.data?.success) {
        setItems(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load equipment list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleCreateItem = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await adminApi.createToolbankItem({
        item_name: itemName,
        category,
        description,
        credit_requirement: parseInt(creditReq, 10),
        total_quantity: parseInt(quantity, 10),
        access_type: accessType,
        max_reservation_days: parseInt(maxDays, 10),
      });

      if (res.data?.success) {
        toast.success('ToolBank equipment item added successfully!');
        setShowAddModal(false);
        setItemName('');
        setDescription('');
        fetchItems();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add item.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">ToolBank Inventory Management</h1>
          <p className="mt-1 text-sm text-slate-500">
            Maintain equipment stock, configure loan durations, and set mechanic credit access thresholds.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center space-x-2 bg-eurogrip-700 hover:bg-eurogrip-800 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add ToolBank Equipment</span>
        </button>
      </div>

      {/* Equipment Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12">
            <LoadingSpinner text="Retrieving equipment inventory..." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-6">Equipment Name</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Credit Threshold</th>
                  <th className="py-3.5 px-4">Stock (Total / Avail)</th>
                  <th className="py-3.5 px-4">Access Mode</th>
                  <th className="py-3.5 px-4">Max Loan Period</th>
                  <th className="py-3.5 px-6 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-6 font-bold text-slate-900">
                      <div className="flex items-center space-x-2">
                        <Wrench className="w-4 h-4 text-eurogrip-700" />
                        <span>{item.item_name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-slate-500 capitalize">{item.category?.replace('_', ' ')}</td>
                    <td className="py-4 px-4 font-mono font-bold text-amber-600">{item.credit_requirement} pts</td>
                    <td className="py-4 px-4 font-medium text-slate-700">
                      {item.total_quantity} total / <strong className="text-emerald-600">{item.available_quantity} available</strong>
                    </td>
                    <td className="py-4 px-4">
                      <Badge variant={item.access_type === 'shared' ? 'purple' : 'primary'}>
                        {item.access_type}
                      </Badge>
                    </td>
                    <td className="py-4 px-4 text-slate-600 font-medium">
                      {item.max_reservation_days > 0 ? `${item.max_reservation_days} Days` : 'Permanent Item'}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Badge variant="success">Active</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Tool Modal */}
      {showAddModal && (
        <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add ToolBank Item">
          <form onSubmit={handleCreateItem} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Equipment Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Digital Tread Depth Gauge"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                >
                  <option value="basic_tools">Basic Hand Tools</option>
                  <option value="advanced_equipment">Advanced Machinery</option>
                  <option value="brand_visibility">Brand Merchandise</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Access Mode</label>
                <select
                  value={accessType}
                  onChange={(e) => setAccessType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                >
                  <option value="individual">Individual Garage Borrowing</option>
                  <option value="shared">Shared Hub Equipment</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Description</label>
              <textarea
                rows={2}
                placeholder="Technical specifications and usage guidelines..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Credit Requirement</label>
                <input
                  type="number"
                  min={0}
                  value={creditReq}
                  onChange={(e) => setCreditReq(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-amber-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Total Stock</label>
                <input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Max Loan Days</label>
                <input
                  type="number"
                  min={0}
                  value={maxDays}
                  onChange={(e) => setMaxDays(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="bg-eurogrip-700 hover:bg-eurogrip-800 text-white font-bold px-5 py-2 rounded-xl shadow-xs disabled:opacity-50"
              >
                {saving ? 'Adding...' : 'Save Equipment'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

