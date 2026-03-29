"use client";

import React from 'react';
import Gallery from '../components/Gallery';

export default function Home() {
  return (
    <main className="min-h-screen bg-[#050505] text-white font-sans selection:bg-cyan-900">
      <Gallery />
    </main>
  );
}
