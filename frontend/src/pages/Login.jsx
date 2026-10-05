import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Lock, Mail, AlertCircle, Compass, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const userData = await login(email, password);
      if (userData.role === 'CUSTOMER') {
        navigate('/portal');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid email or password. Please verify credentials.');
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
          Private Client & Executive Command
        </p>
      </div>

      {/* Login Card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="glass-panel-elevated rounded-3xl py-8 px-6 sm:px-10 border border-[rgba(245,230,211,0.18)] shadow-2xl relative">
          {/* Subtle top inner light */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[rgba(245,230,211,0.3)] to-transparent" />

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3.5 rounded-xl bg-[rgba(180,28,56,0.2)] border border-[rgba(244,63,94,0.3)] text-xs text-[#fca5a5] flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-[#fca5a5] mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

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
                Passcode
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#baa293]">
                  <Lock className="w-4 h-4 opacity-70" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="block w-full pl-10 pr-11 py-2.5 rounded-xl text-xs sm:text-sm glass-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide passcode' : 'Show passcode'}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#baa293] hover:text-[#faf6f0] opacity-75 hover:opacity-100 transition-all cursor-pointer focus:outline-none"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 stroke-[1.5]" />
                  ) : (
                    <Eye className="w-4 h-4 stroke-[1.5]" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-glass-primary w-full py-3 px-4 rounded-xl text-xs font-semibold uppercase tracking-wider text-[#faf6f0] mt-2 gap-2"
            >
              <span>{loading ? 'Authenticating...' : 'Enter Sanctuary'}</span>
              <ArrowRight className="w-4 h-4 opacity-80" />
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-[rgba(245,230,211,0.1)] text-center">
            <p className="text-xs text-[#baa293]">
              Requesting private membership?{' '}
              <Link to="/register" className="font-medium text-[#c8a47e] hover:text-[#f3e7db] transition-colors ml-1">
                Register credential
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
