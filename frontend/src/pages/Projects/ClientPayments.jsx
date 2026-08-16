import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { projectPaymentsAPI } from '../../api';
import { DollarSign, Plus, Search } from 'lucide-react';

export default function ClientPayments() {
  const { projectId } = useParams();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPayments();
  }, [projectId]);

  const loadPayments = async () => {
    try {
      const res = await projectPaymentsAPI.getAll({ project_id: projectId });
      if (res.data.success) {
        setPayments(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load payments', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(to bottom right, #A0975A, #8a824a)' }}>
            <DollarSign size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Client Payments</h1>
            <p className="text-gray-500 text-sm">Manage client payments and milestones</p>
          </div>
        </div>
        <button className="btn-primary inline-flex items-center gap-2">
          <Plus size={18} /> Add Payment
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            No payments recorded yet
          </div>
        ) : (
          <div className="space-y-3">
            {payments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-semibold text-gray-900">{payment.payment_code}</p>
                  <p className="text-sm text-gray-500">{payment.payment_date}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">৳{Number(payment.amount).toLocaleString()}</p>
                  <p className="text-xs text-gray-500 capitalize">{payment.payment_method}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
