import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { User, Mail, Phone, Building, CheckCircle2, AlertCircle, Save, Lock, ShieldCheck } from 'lucide-react';

export function CustomerProfile() {
  const { user, updateUser } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    company: user?.company || '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      setSuccessMsg('');

      const payload = {
        name: formData.name,
        phone: formData.phone || null,
        company: formData.company || null
      };
      if (formData.password) {
        payload.password = formData.password;
      }

      const res = await api.put('/customer/profile', payload);
      updateUser(res.data);
      setSuccessMsg('Private client profile successfully updated.');
      setFormData(prev => ({ ...prev, password: '' }));
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Failed to update profile:', err);
      setError(err.response?.data?.detail || 'Failed to update client profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[rgba(200,164,126,0.18)] border border-[rgba(245,230,211,0.25)] text-[#f3e7db] text-[10px] font-sans-ui uppercase tracking-luxury mb-2">
          <ShieldCheck className="w-3 h-3 text-[#c8a47e]" />
          Accredited Identity
        </div>
        <h1 className="font-editorial text-3xl sm:text-4xl font-normal text-[#faf6f0]">
          Client Profile & Credentials
        </h1>
        <p className="text-xs text-[#baa293] font-light mt-1">
          Manage your verified communication channels and private credentials.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-[rgba(180,28,56,0.2)] border border-[rgba(244,63,94,0.3)] text-xs text-[#fca5a5] flex items-center gap-3">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-[rgba(74,157,110,0.2)] border border-[rgba(74,157,110,0.3)] text-xs text-[#a3e3bd] flex items-center gap-3">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="glass-panel-elevated rounded-3xl border border-[rgba(245,230,211,0.18)] shadow-2xl p-7 relative">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[rgba(245,230,211,0.3)] to-transparent" />

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#baa293] mb-1.5">
              Full Legal Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#baa293]" />
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl glass-input"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#baa293] mb-1.5">
              Accredited Email (Immutable)
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#baa293] opacity-60" />
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl glass-input opacity-60 cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#baa293] mb-1.5">
              Telephone Number
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#baa293]" />
              <input
                type="tel"
                name="phone"
                placeholder="+1 (555) 019-2834"
                value={formData.phone}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl glass-input"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#baa293] mb-1.5">
              Enterprise / Estate Name (Optional)
            </label>
            <div className="relative">
              <Building className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#baa293]" />
              <input
                type="text"
                name="company"
                placeholder="House of Vance"
                value={formData.company}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl glass-input"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#baa293] mb-1.5">
              Update Passcode (Leave vacant to retain current)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#baa293]" />
              <input
                type="password"
                name="password"
                placeholder="Inscribe new secure passcode..."
                value={formData.password}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl glass-input"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="btn-glass-primary px-6 py-2.5 rounded-xl text-xs font-semibold"
            >
              <Save className="w-4 h-4 mr-2 text-[#c8a47e]" />
              {loading ? 'Committing...' : 'Commit Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CustomerProfile;
