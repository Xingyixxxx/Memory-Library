import React from 'react';
import { ChevronLeft, Search, Share, Mic, X, ArrowLeft, AudioLines } from 'lucide-react';
import ParticleCanvas from './ParticleCanvas';
import { motion } from 'motion/react';

export default function ParticleDetail({ onBack, id }: { onBack: () => void, id: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative w-full h-screen bg-[#050505] text-zinc-300 font-sans overflow-hidden flex flex-col"
    >
      {/* Top Bar */}
      <div className="flex justify-between items-center p-6 z-10">
        <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="flex gap-4">
          <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <Search className="w-5 h-5" />
          </button>
          <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <Share className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-center gap-6 md:gap-12 text-[10px] md:text-xs tracking-[0.2em] uppercase z-10 mt-2">
        <button className="hover:text-white transition-colors">The Garden</button>
        <button className="text-white">Memory</button>
        <button className="hover:text-white transition-colors">Music</button>
        <button className="hover:text-white transition-colors">Info</button>
      </div>

      {/* Gemini Badge */}
      <div className="flex justify-center mt-8 z-10">
        <div className="flex items-center gap-3 bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-full px-5 py-2 shadow-lg">
          <div className="bg-zinc-800 p-1.5 rounded-full">
            <AudioLines className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
          <span className="text-base font-serif tracking-wide text-zinc-200">Gemini</span>
        </div>
      </div>

      {/* Particle Canvas Area */}
      <div className="flex-1 relative w-full flex items-center justify-center">
        <ParticleCanvas />
        
        {/* Decorative dot on the right */}
        <div className="absolute right-8 md:right-12 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full border border-zinc-700 flex items-center justify-center z-10">
          <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full"></div>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="flex flex-col items-center pb-12 z-10 gap-6">
        {/* Input Box */}
        <div className="relative w-72 md:w-80">
          <input 
            type="text" 
            placeholder="type here..." 
            className="w-full bg-zinc-900/60 backdrop-blur-md border border-zinc-800 rounded-2xl py-3.5 px-6 text-sm focus:outline-none focus:border-zinc-600 transition-colors placeholder:text-zinc-600 text-center shadow-lg"
          />
          <button className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-zinc-800 rounded-full hover:bg-zinc-700 transition-colors">
            <Mic className="w-4 h-4 text-zinc-300" />
          </button>
        </div>

        {/* Timer & Actions */}
        <div className="flex items-center gap-4">
          <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-full px-4 py-1.5 text-xs font-mono shadow-lg">
            00:03
          </div>
          <button className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-full px-5 py-1.5 text-xs text-zinc-400 hover:bg-zinc-800 transition-colors flex items-center gap-2 shadow-lg">
            Save Memory <span className="text-zinc-600">&gt;</span>
          </button>
          <button className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-full w-8 h-8 flex items-center justify-center hover:bg-zinc-800 transition-colors shadow-lg">
            <X className="w-3 h-3 text-rose-400" />
          </button>
        </div>

        {/* Upload Another */}
        <button 
          onClick={onBack}
          className="mt-4 flex items-center gap-2 text-xs bg-zinc-900/50 backdrop-blur-md border border-zinc-800 rounded-full px-6 py-2.5 hover:bg-zinc-800 transition-colors shadow-lg"
        >
          <ArrowLeft className="w-3 h-3" />
          Upload Another
        </button>
      </div>
    </motion.div>
  );
}
