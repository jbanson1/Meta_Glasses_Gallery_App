'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import styles from './ar-preview.module.css';

type Mode = 'camera' | 'photo' | 'xr';

interface ModeCard {
  mode: Mode;
  label: string;
  description: string;
  icon: React.ReactNode;
  href: string;
}

const HeadsetIcon = () => (
  <svg width="32" height="32" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="6" y="18" width="52" height="28" rx="8" stroke="currentColor" strokeWidth="2.5" />
    <circle cx="22" cy="32" r="7" stroke="currentColor" strokeWidth="2" />
    <circle cx="42" cy="32" r="7" stroke="currentColor" strokeWidth="2" />
    <path d="M29 32h6" stroke="currentColor" strokeWidth="2" />
    <path d="M2 28v8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M62 28v8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

const CameraIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);

const PhotoIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <path d="M21 15l-5-5L5 21" />
  </svg>
);

export default function ARPreviewPage() {
  const searchParams = useSearchParams();
  const [xrAvailable, setXrAvailable] = useState(false);

  // Forward query params to child routes
  const paramString = searchParams.toString();
  const qs = paramString ? `?${paramString}` : '';

  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.xr) {
      navigator.xr.isSessionSupported('immersive-ar').then(setXrAvailable).catch(() => {});
      if (!xrAvailable) {
        navigator.xr.isSessionSupported('immersive-vr').then(setXrAvailable).catch(() => {});
      }
    }
  }, [xrAvailable]);

  const cards: ModeCard[] = [
    {
      mode: 'camera',
      label: 'Live Camera',
      description: 'Use your device camera to preview artwork on your walls in real time.',
      icon: <CameraIcon />,
      href: `/ar-preview/camera${qs}`,
    },
    {
      mode: 'photo',
      label: 'Room Photo',
      description: 'Upload a photo of your room and place artwork digitally.',
      icon: <PhotoIcon />,
      href: `/ar-preview/photo${qs}`,
    },
    {
      mode: 'xr',
      label: 'Meta Quest / WebXR',
      description:
        'Place artwork on your real walls with surface detection. Supports Quest 3 mixed reality and Quest 2 VR.',
      icon: <HeadsetIcon />,
      href: `/ar-preview/xr${qs}`,
    },
  ];

  // Show WebXR card first if XR is detected
  const sortedCards = xrAvailable
    ? [cards[2], cards[0], cards[1]]
    : cards;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>AR Preview</h1>
      <p className={styles.subtitle}>Choose how you want to preview artwork in your space.</p>
      <div className={styles.grid}>
        {sortedCards.map((card) => (
          <a key={card.mode} href={card.href} className={styles.card}>
            <div className={styles.cardIcon}>{card.icon}</div>
            <h2 className={styles.cardLabel}>{card.label}</h2>
            <p className={styles.cardDesc}>{card.description}</p>
          </a>
        ))}
      </div>
    </div>
  );
}
