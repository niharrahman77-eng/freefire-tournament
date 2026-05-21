// pages/admin/banners.js
import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { db } from '../../lib/firebase';
import {
  collection, getDocs, addDoc, deleteDoc,
  doc, updateDoc, serverTimestamp, orderBy, query
} from 'firebase/firestore';
import { useRouter } from 'next/router';
import Link from 'next/link';
import toast from 'react-hot-toast';

const COLORS = [
  { bg: '#FF6B00', bg2: '#FF3D00', label: '🔥 Orange' },
  { bg: '#7C3AED', bg2: '#4F46E5', label: '💜 Purple' },
  { bg: '#059669', bg2: '#047857', label: '💚 Green' },
  { bg: '#DC2626', bg2: '#B91C1C', label: '❤️ Red' },
  { bg: '#2563EB', bg2: '#1D4ED8', label: '💙 Blue' },
  { bg: '#D97706', bg2: '#B45309', label: '💛 Gold' },
];

export default function AdminBanners() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const [banners, setBanners] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    title: '',
    subtitle: '',
    tag: '',
    imageUrl: '',
    bgColor: '#FF6B00',
    bgColor2: '#FF3D00',
    buttonText: '',
    buttonLink: '/',
    active: true,
  });

  useEffect(() => {
    if (!loading && (!user || !userData?.isAdmin)) router.push('/');
  }, [user, userData, loading]);

  useEffect(() => {
    if (!userData?.isAdmin) return;
    fetchBanners();
  }, [userData]);

  async function fetchBanners() {
    try {
      const q = query(collection(db, 'banners'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setBanners(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch {}
  }

  function handleChange(e) {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm(prev => ({ ...prev, [e.target.name]: val }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title) return toast.error('Title is required');
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'banners'), {
        ...form,
        createdAt: serverTimestamp(),
      });
      toast.success('Banner added!');
      setForm({
        title: '', subtitle: '', tag: '', imageUrl: '',
        bgColor: '#FF6B00', bgColor2: '#FF3D00',
        buttonText: '', buttonLink: '/', active: true,
      });
      setShowForm(false);
      fetchBanners();
    } catch (err) {
      toast.error('Error: ' + err.message);
    }
    setSubmitting(false);
  }

  async function toggleActive(banner) {
    try {
      await updateDoc(doc(db, 'banners', banner.id), { active: !banner.active });
      toast.success(banner.active ? 'Banner hidden' : 'Banner shown');
      fetchBanners();
    } catch { toast.error('Error updating'); }
  }

  async function deleteBanner(id) {
    try {
      await deleteDoc(doc(db, 'banners', id));
      toast.success('Banner deleted');
      fetchBanners();
    } catch { toast.error('Error deleting'); }
  }

  if (!userData?.isAdmin) return null;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="text-gray-500 hover:text-ff-orange text-sm">← Admin</Link>
          <h1 className="section-title">Banners</h1>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? 'Cancel' : '+ Add Banner'}
        </button>
      </div>

      {/* Add Banner Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="card mb-6 flex flex-col gap-4">
          <h2 className="font-game font-bold text-lg">New Banner</h2>

          <div>
            <label className="text-gray-400 text-xs font-game uppercase mb-1 block">Title *</label>
            <input name="title" value={form.title} onChange={handleChange}
              className="input-field" placeholder="e.g. Weekend Tournament is LIVE!" />
          </div>

          <div>
            <label className="text-gray-400 text-xs font-game uppercase mb-1 block">Subtitle</label>
            <input name="subtitle" value={form.subtitle} onChange={handleChange}
              className="input-field" placeholder="e.g. Win up to ₹500 this weekend" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-gray-400 text-xs font-game uppercase mb-1 block">Tag (small badge)</label>
              <input name="tag" value={form.tag} onChange={handleChange}
                className="input-field" placeholder="e.g. NEW · HOT · LIMITED" />
            </div>
            <div>
              <label className="text-gray-400 text-xs font-game uppercase mb-1 block">Button Text</label>
              <input name="buttonText" value={form.buttonText} onChange={handleChange}
                className="input-field" placeholder="e.g. Join Now" />
            </div>
          </div>

          <div>
            <label className="text-gray-400 text-xs font-game uppercase mb-1 block">Button Link</label>
            <input name="buttonLink" value={form.buttonLink} onChange={handleChange}
              className="input-field" placeholder="e.g. / or /tournament/abc123" />
          </div>

          <div>
            <label className="text-gray-400 text-xs font-game uppercase mb-1 block">
              Image URL (optional — paste image link from internet)
            </label>
            <input name="imageUrl" value={form.imageUrl} onChange={handleChange}
              className="input-field" placeholder="https://example.com/image.jpg" />
            <p className="text-gray-600 text-xs mt-1">Leave empty to use color background instead</p>
          </div>

          {/* Color Picker (shown only if no image) */}
          {!form.imageUrl && (
            <div>
              <label className="text-gray-400 text-xs font-game uppercase mb-2 block">Background Color</label>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                {COLORS.map(c => (
                  <button
                    key={c.bg}
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, bgColor: c.bg, bgColor2: c.bg2 }))}
                    className={`py-2 rounded-lg text-xs font-game transition-all border-2
                      ${form.bgColor === c.bg ? 'border-white scale-105' : 'border-transparent'}`}
                    style={{ background: `linear-gradient(135deg, ${c.bg}, ${c.bg2})` }}>
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Preview */}
          <div>
            <label className="text-gray-400 text-xs font-game uppercase mb-2 block">Preview</label>
            <div
              className="relative w-full h-32 rounded-xl flex items-center justify-center overflow-hidden"
              style={{
                background: form.imageUrl
                  ? `url(${form.imageUrl}) center/cover no-repeat`
                  : `linear-gradient(135deg, ${form.bgColor}, ${form.bgColor2})`,
              }}>
              <div className="absolute inset-0 bg-black/40 rounded-xl" />
              <div className="relative z-10 text-center px-4">
                {form.tag && (
                  <span className="bg-ff-orange text-white font-game text-xs px-2 py-0.5 rounded-full uppercase mb-1 inline-block">
                    {form.tag}
                  </span>
                )}
                <p className="font-game font-bold text-xl text-white">{form.title || 'Banner Title'}</p>
                {form.subtitle && <p className="text-gray-200 text-xs mt-0.5">{form.subtitle}</p>}
                {form.buttonText && (
                  <span className="inline-block mt-2 bg-ff-orange text-white font-game text-xs px-3 py-1 rounded-lg border border-orange-400">
                    {form.buttonText}
                  </span>
                )}
              </div>
            </div>
          </div>

          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? 'Adding...' : '+ Add Banner'}
          </button>
        </form>
      )}

      {/* Banner List */}
      {banners.length === 0 ? (
        <div className="card text-center py-10">
          <p className="text-4xl mb-3">🖼️</p>
          <p className="text-gray-400 font-game">No banners yet</p>
          <p className="text-gray-500 text-sm mt-1">Add a banner to show on homepage</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {banners.map(b => (
            <div key={b.id} className={`card border-2 ${b.active ? 'border-green-800' : 'border-ff-border opacity-60'}`}>
              {/* Preview */}
              <div
                className="w-full h-24 rounded-lg flex items-center justify-center mb-3 overflow-hidden relative"
                style={{
                  background: b.imageUrl
                    ? `url(${b.imageUrl}) center/cover no-repeat`
                    : `linear-gradient(135deg, ${b.bgColor || '#FF6B00'}, ${b.bgColor2 || '#FF3D00'})`,
                }}>
                <div className="absolute inset-0 bg-black/40" />
                <div className="relative z-10 text-center">
                  {b.tag && <span className="text-white text-xs bg-ff-orange px-2 py-0.5 rounded-full">{b.tag}</span>}
                  <p className="font-game font-bold text-white text-lg">{b.title}</p>
                  {b.subtitle && <p className="text-gray-200 text-xs">{b.subtitle}</p>}
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-bold text-sm">{b.title}</p>
                  <span className={`text-xs font-game ${b.active ? 'text-green-400' : 'text-gray-500'}`}>
                    {b.active ? '✅ Showing on homepage' : '⭕ Hidden'}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => toggleActive(b)}
                    className={`text-xs font-game px-3 py-1.5 rounded-lg border-2 transition-all
                      ${b.active
                        ? 'border-gray-600 text-gray-400 hover:border-red-500 hover:text-red-400'
                        : 'border-green-600 text-green-400 hover:bg-green-900/20'}`}>
                    {b.active ? '🙈 Hide' : '👁️ Show'}
                  </button>
                  <button onClick={() => deleteBanner(b.id)}
                    className="text-xs font-game px-3 py-1.5 rounded-lg border-2 border-red-700 text-red-400 hover:bg-red-900/20 transition-all">
                    🗑 Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
