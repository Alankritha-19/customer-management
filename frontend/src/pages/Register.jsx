import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Lock, Mail, User, Phone, Briefcase, UserCheck, AlertCircle, Compass } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('BUSINESS_OWNER'); // 'BUSINESS_OWNER' | 'CUSTOMER'
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('Passcode must be at least 6 characters in length.');
      return;
    }
    setLoading(true);
    try {
      const userData = await register(name, email, password, role, phone);
      if (userData.role === 'CUSTOMER') {
        navigate('/portal');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Editorial Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[rgba(200,164,126,0.16)] border border-[rgba(245,230,211,0.25)] text-[#faf6f0] shadow-lg mb-4">
          <Compass className="w-7 h-7 text-[#ecdcc9]" />
        </div>
        <h1 className="font-editorial text-3xl sm:text-4xl font-normal tracking-wide text-[#faf6f0]">
          AURELIA
        </h1>
        <p className="mt-1 text-xs font-sans-ui uppercase tracking-luxury text-[#c4ada0]">
          Access Accreditation & Membership
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="glass-panel-elevated rounded-3xl py-8 px-6 sm:px-10 border border-[rgba(245,230,211,0.18)] shadow-2xl relative">
          {/* Subtle top inner light */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[rgba(245,230,211,0.3)] to-transparent" />

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3.5 rounded-xl bg-[rgba(180,28,56,0.2)] border border-[rgba(244,63,94,0.3)] text-xs text-[#fca5a5] flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-[#fca5a5] mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            {/* Role Selection */}
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-[#baa293] mb-1.5">
                Membership Category
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('BUSINESS_OWNER')}
                  className={`p-3 rounded-2xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                    role === 'BUSINESS_OWNER'
                      ? 'bg-[rgba(245,230,211,0.18)] border-[rgba(245,230,211,0.35)] text-white shadow-xs'
                      : 'bg-[rgba(255,255,255,0.04)] border-[rgba(245,230,211,0.1)] text-[#baa293] hover:border-[rgba(245,230,211,0.2)]'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-medium text-xs">
                    <Briefcase className="w-3.5 h-3.5 text-[#c8a47e]" />
                    <span className={role === 'BUSINESS_OWNER' ? 'text-white' : 'text-[#baa293]'}>Managing Principal</span>
                  </div>
                  <span className="text-[10px] text-[#a99587] leading-tight">Executive Studio & Client Dossiers</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('CUSTOMER')}
                  className={`p-3 rounded-2xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                    role === 'CUSTOMER'
                      ? 'bg-[rgba(245,230,211,0.18)] border-[rgba(245,230,211,0.35)] text-white shadow-xs'
                      : 'bg-[rgba(255,255,255,0.04)] border-[rgba(245,230,211,0.1)] text-[#baa293] hover:border-[rgba(245,230,211,0.2)]'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-medium text-xs">
                    <UserCheck className="w-3.5 h-3.5 text-[#a3e3bd]" />
                    <span className={role === 'CUSTOMER' ? 'text-white' : 'text-[#baa293]'}>Private Client</span>
                  </div>
                  <span className="text-[10px] text-[#a99587] leading-tight">Inquiries & Concierge Access</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-[#baa293] mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#baa293]">
                  <User className="w-4 h-4 opacity-70" />
                </div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={role === 'BUSINESS_OWNER' ? 'Julian Sterling' : 'Constance Sterling'}
                  className="block w-full pl-10 pr-3.5 py-2.5 rounded-xl text-xs sm:text-sm glass-input"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-[#baa293] mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#baa293]">
                  <Mail className="w-4 h-4 opacity-70" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="identity@aurelia.com"
                  className="block w-full pl-10 pr-3.5 py-2.5 rounded-xl text-xs sm:text-sm glass-input"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-[#baa293] mb-1.5">
                Telephone (Optional)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#baa293]">
                  <Phone className="w-4 h-4 opacity-70" />
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 019-2834"
                  className="block w-full pl-10 pr-3.5 py-2.5 rounded-xl text-xs sm:text-sm glass-input"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-[#baa293] mb-1.5">
                Passcode
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#baa293]">
                  <Lock className="w-4 h-4 opacity-70" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="block w-full pl-10 pr-3.5 py-2.5 rounded-xl text-xs sm:text-sm glass-input"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-glass-primary w-full py-3 px-4 rounded-xl text-xs font-semibold uppercase tracking-wider text-[#faf6f0] mt-2 gap-2"
            >
              <span>{loading ? 'Accrediting...' : `Inscribe as ${role === 'BUSINESS_OWNER' ? 'Principal' : 'Client'}`}</span>
              <ArrowRight className="w-4 h-4 opacity-80" />
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-[rgba(245,230,211,0.1)] text-center">
            <p className="text-xs text-[#baa293]">
              Already holds membership?{' '}
              <Link to="/login" className="font-medium text-[#c8a47e] hover:text-[#f3e7db] transition-colors ml-1">
                Enter Sanctuary
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
