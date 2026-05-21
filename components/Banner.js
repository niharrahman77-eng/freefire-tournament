// components/Banner.js
import { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import Link from 'next/link';

export default function Banner() {
  const [banners, setBanners] = useState([]);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    async function fetchBanners() {
      try {
        const q = query(collection(db, 'banners'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        const active = list.filter(b => b.active !== false);
        setBanners(active);
      } catch {}
    }
    fetchBanners();
  }, []);

  // Auto slide every 3 seconds
  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent(prev => (prev + 1) % banners.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [banners]);

  if (banners.length === 0) return null;

  const banner = banners[current];

  return (
    <div className="relative mb-6 rounded-xl overflow-hidden">
      <div
        className="relative w-full h-40 md:h-52 flex items-center justify-center rounded-xl overflow-hidden"
        style={{
          background: banner.imageUrl
            ? `url(${banner.imageUrl}) center/cover no-repeat`
            : `linear-gradient(135deg, ${banner.bgColor || '#FF6B00'}, ${banner.bgColor2 || '#FF3D00'})`,
        }}>

        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/40 rounded-xl" />

        {/* Content */}
        <div className="relative z-10 text-center px-6">
          {banner.tag && (
            <span className="bg-ff-orange text-white font-game text-xs px-3 py-1 rounded-full uppercase mb-2 inline-block">
              {banner.tag}
            </span>
          )}
          <h2 className="font-game font-bold text-2xl md:text-3xl text-white mb-1">
            {banner.title}
          </h2>
          {banner.subtitle && (
            <p className="text-gray-200 text-sm">{banner.subtitle}</p>
          )}
          {banner.buttonText && banner.buttonLink && (
            <Link href={banner.buttonLink}
              className="inline-block mt-3 bg-ff-orange hover:bg-orange-500 text-white font-game font-bold px-5 py-2 rounded-lg border-2 border-orange-400 text-sm uppercase transition-all">
              {banner.buttonText}
            </Link>
          )}
        </div>

        {/* Navigation Arrows */}
        {banners.length > 1 && (
          <>
            <button
              onClick={() => setCurrent(prev => (prev - 1 + banners.length) % banners.length)}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-all z-20 text-xl">
              ‹
            </button>
            <button
              onClick={() => setCurrent(prev => (prev + 1) % banners.length)}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-all z-20 text-xl">
              ›
            </button>
          </>
        )}
      </div>

      {/* Dots */}
      {banners.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-2">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`rounded-full transition-all ${i === current
                ? 'bg-ff-orange w-4 h-2'
                : 'bg-gray-600 w-2 h-2'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
