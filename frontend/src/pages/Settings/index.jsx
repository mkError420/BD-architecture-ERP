import { useState, useEffect } from 'react';
import { settingsAPI } from '../../api';
import { Building2, Save, Globe, DollarSign, Shield, Receipt } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    company_name: 'Bangladesh Construction & Engineering Ltd.',
    company_address: 'House 45, Road 11, Block D, Banani, Dhaka-1213',
    company_phone: '+880 1700-000000',
    company_email: 'contact@bdconstruction.com.bd',
    trade_license: 'TRAD/DNCC/012938/2024',
    bin_number: '001239845-0101',
    currency: 'BDT',
    currency_symbol: '৳',
    vat_rate: '15',
    tax_rate: '5',
    fiscal_year: '2025-2026',
    language: 'en',
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await settingsAPI.getAll();
      if (res.data.success && Object.keys(res.data.data).length > 0) {
        setSettings(prev => ({ ...prev, ...res.data.data }));
      }
    } catch {
      console.warn('Fallback settings');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await settingsAPI.update(settings);
      toast.success('Company settings saved successfully!');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System & Enterprise Settings</h1>
          <p className="text-gray-500 text-sm mt-1">Configure company profile, tax compliance parameters, and Bangladesh fiscal defaults</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Enterprise Profile */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 font-bold text-gray-900 border-b border-gray-100 pb-3">
            <Building2 size={20} className="text-primary-600" />
            <span>Company & Enterprise Profile</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="form-label">Company Legal Name *</label>
              <input
                type="text"
                required
                value={settings.company_name}
                onChange={(e) => handleChange('company_name', e.target.value)}
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Official Contact Phone</label>
              <input
                type="text"
                value={settings.company_phone}
                onChange={(e) => handleChange('company_phone', e.target.value)}
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Official Email</label>
              <input
                type="email"
                value={settings.company_email}
                onChange={(e) => handleChange('company_email', e.target.value)}
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Trade License Number</label>
              <input
                type="text"
                value={settings.trade_license}
                onChange={(e) => handleChange('trade_license', e.target.value)}
                className="form-input font-mono"
              />
            </div>

            <div>
              <label className="form-label">BIN / Business Identification Number (NBR)</label>
              <input
                type="text"
                value={settings.bin_number}
                onChange={(e) => handleChange('bin_number', e.target.value)}
                className="form-input font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="form-label">Registered Head Office Address</label>
              <input
                type="text"
                value={settings.company_address}
                onChange={(e) => handleChange('company_address', e.target.value)}
                className="form-input"
              />
            </div>
          </div>
        </div>

        {/* Financial & Tax Defaults */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 font-bold text-gray-900 border-b border-gray-100 pb-3">
            <Receipt size={20} className="text-primary-600" />
            <span>Currency & Bangladesh VAT / Tax Defaults</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="form-label">System Currency</label>
              <input
                type="text"
                disabled
                value="Bangladeshi Taka (BDT - ৳)"
                className="form-input bg-gray-50 text-gray-500 font-semibold"
              />
            </div>

            <div>
              <label className="form-label">Standard VAT Rate (%)</label>
              <input
                type="number"
                value={settings.vat_rate}
                onChange={(e) => handleChange('vat_rate', e.target.value)}
                className="form-input font-semibold"
              />
            </div>

            <div>
              <label className="form-label">Advance Tax / TDS Rate (%)</label>
              <input
                type="number"
                value={settings.tax_rate}
                onChange={(e) => handleChange('tax_rate', e.target.value)}
                className="form-input font-semibold"
              />
            </div>

            <div>
              <label className="form-label">Current Fiscal Year</label>
              <input
                type="text"
                value={settings.fiscal_year}
                onChange={(e) => handleChange('fiscal_year', e.target.value)}
                className="form-input font-mono"
              />
            </div>

            <div>
              <label className="form-label">UI Language</label>
              <select
                value={settings.language}
                onChange={(e) => handleChange('language', e.target.value)}
                className="form-input"
              >
                <option value="en">English (Primary)</option>
                <option value="bn">বাংলা (Bilingual Labels)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="btn-primary px-6 py-3 shadow-lg shadow-primary-600/30"
          >
            <Save size={18} /> {saving ? 'Saving Changes...' : 'Save All Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
