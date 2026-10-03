import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  Plus, 
  ExternalLink, 
  Tag, 
  Trash2, 
  Edit3, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  Search,
  RefreshCw
} from 'lucide-react';
import api from '../api/client';
import { Modal } from '../components/common/Modal';

export const Portfolio = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Add / Edit Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState({
    title: '',
    category: '',
    tags: '',
    asset_url: '',
    thumbnail_url: '',
    description: '',
    is_active: true
  });
  const [saving, setSaving] = useState(false);

  // Matchmaker interactive testing state
  const [testQuery, setTestQuery] = useState('Looking for a minimalist beach wedding photographer with drone visuals');
  const [matchResults, setMatchResults] = useState(null);
  const [matching, setMatching] = useState(false);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await api.get('/portfolio');
      setItems(res.data || []);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load portfolio items.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const openAddModal = () => {
    setEditingItem(null);
    setForm({
      title: '',
      category: '',
      tags: '',
      asset_url: '',
      thumbnail_url: '',
      description: '',
      is_active: true
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setForm({
      title: item.title,
      category: item.category || '',
      tags: item.tags,
      asset_url: item.asset_url,
      thumbnail_url: item.thumbnail_url || '',
      description: item.description || '',
      is_active: item.is_active
    });
    setIsModalOpen(true);
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editingItem) {
        const res = await api.put(`/portfolio/${editingItem.id}`, form);
        setItems(prev => prev.map(it => it.id === editingItem.id ? res.data : it));
        setSuccessMsg('Portfolio asset updated successfully!');
      } else {
        const res = await api.post('/portfolio', form);
        setItems(prev => [res.data, ...prev]);
        setSuccessMsg('New portfolio asset added to matchmaker!');
      }
      setIsModalOpen(false);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save portfolio item.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteItem = async (id) => {
    if (!window.confirm('Are you sure you want to delete this portfolio asset?')) return;
    try {
      await api.delete(`/portfolio/${id}`);
      setItems(prev => prev.filter(it => it.id !== id));
      setSuccessMsg('Portfolio asset removed.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete item.');
    }
  };

  const handleTestMatch = async () => {
    if (!testQuery.trim()) return;
    setMatching(true);
    try {
      const res = await api.post('/portfolio/match', { text: testQuery, limit: 2 });
      setMatchResults(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setMatching(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-indigo-600" />
            Instant Portfolio & Asset Matchmaker
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Store case studies, photo galleries, and project links. When inquiries mention keywords, AI automatically appends matching links into responses.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Portfolio Asset
        </button>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Matchmaker Interactive Tester Card */}
      <div className="p-5 bg-gradient-to-br from-indigo-50/60 via-white to-purple-50/40 rounded-xl border border-indigo-100 shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-indigo-900 font-bold text-sm">
          <Sparkles className="w-4 h-4 text-indigo-600" />
          <span>Test Live Tag Matchmaker</span>
        </div>
        <p className="text-xs text-slate-600">
          Enter any simulated customer message to see which portfolio case study link will be automatically appended to the suggested reply:
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={testQuery}
            onChange={(e) => setTestQuery(e.target.value)}
            placeholder="e.g. Planning a minimalist beach wedding, need photos and video"
            className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={handleTestMatch}
            disabled={matching}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
          >
            {matching ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
            Test Match
          </button>
        </div>

        {matchResults && (
          <div className="p-4 bg-white rounded-lg border border-slate-200 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">Matched Assets ({matchResults.count})</span>
              <div className="flex items-center gap-1">
                <span className="text-slate-400">Triggered Tags:</span>
                {matchResults.matched_tags.map(tag => (
                  <span key={tag} className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full font-medium text-[10px]">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
            {matchResults.matched_items.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No matching portfolio tags found for this query.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {matchResults.matched_items.map(item => (
                  <div key={item.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900">{item.title}</span>
                      <span className="text-[10px] px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-semibold">100% Match</span>
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-1">{item.description}</p>
                    <a
                      href={item.asset_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-indigo-600 hover:underline flex items-center gap-1 font-medium"
                    >
                      <ExternalLink className="w-3 h-3" />
                      {item.asset_url}
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Portfolio Items Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-400">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
          <p className="text-xs font-semibold">Loading portfolio library...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
          <Briefcase className="w-10 h-10 mx-auto text-slate-300 mb-2" />
          <h4 className="font-bold text-slate-800 text-sm">No portfolio items added yet</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Add your best case studies and photo links to enable instant portfolio matchmaking in AI reply drafts.
          </p>
          <button
            onClick={openAddModal}
            className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add First Asset
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map(item => (
            <div key={item.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
              {item.thumbnail_url && (
                <div className="h-40 w-full overflow-hidden bg-slate-100 relative">
                  <img
                    src={item.thumbnail_url}
                    alt={item.title}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                  {item.category && (
                    <span className="absolute top-2 left-2 px-2 py-1 bg-black/60 backdrop-blur-xs text-white rounded-md text-[10px] font-semibold">
                      {item.category}
                    </span>
                  )}
                </div>
              )}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  {!item.thumbnail_url && item.category && (
                    <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-semibold mb-2">
                      {item.category}
                    </span>
                  )}
                  <h3 className="font-bold text-sm text-slate-900">{item.title}</h3>
                  {item.description && (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  )}
                </div>

                {/* Tag Pills */}
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-1.5">
                    {item.tags.split(',').map((t, i) => (
                      <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[10px] font-medium flex items-center gap-1">
                        <Tag className="w-2.5 h-2.5 text-slate-400" />
                        {t.trim()}
                      </span>
                    ))}
                  </div>

                  <a
                    href={item.asset_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors pt-1"
                  >
                    <span>View Case Study / Link</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                {/* Card Actions */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => openEditModal(item)}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                    title="Edit asset"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                    title="Delete asset"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Edit Portfolio Asset' : 'Add New Portfolio Asset'}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSaveItem} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Asset Title *</label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Minimalist Beach Wedding Showcase"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
              <input
                type="text"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="e.g. Wedding Photography, E-Commerce"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Matchmaker Tags * (comma-separated)</label>
              <input
                type="text"
                required
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                placeholder="beach, minimalist, wedding, photography"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Asset / Case Study URL *</label>
            <input
              type="url"
              required
              value={form.asset_url}
              onChange={(e) => setForm({ ...form, asset_url: e.target.value })}
              placeholder="https://portfolio.example.com/beach-wedding-case-study"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Thumbnail Image URL (Optional)</label>
            <input
              type="url"
              value={form.thumbnail_url}
              onChange={(e) => setForm({ ...form, thumbnail_url: e.target.value })}
              placeholder="https://images.unsplash.com/..."
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              rows="3"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Summary of this portfolio piece and what makes it unique..."
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              {saving ? 'Saving...' : editingItem ? 'Save Changes' : 'Create Asset'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
