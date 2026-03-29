import React from 'react';
import { Reorder, motion } from 'motion/react';
import { GripVertical } from 'lucide-react';

interface OverviewGridProps {
  items: any[];
  onReorder: (newItems: any[]) => void;
  onSelect: (index: number) => void;
}

export default function OverviewGrid({ items, onReorder, onSelect }: OverviewGridProps) {
  return (
    <div className="w-full max-w-6xl mx-auto px-6 py-20 min-h-screen">
      <div className="mb-12 flex items-end justify-between border-b border-zinc-800 pb-4">
        <div>
          <h2 className="text-3xl font-serif tracking-widest uppercase text-white mb-2">Memory Archive</h2>
          <p className="text-zinc-500 font-light tracking-wider text-sm">Drag to reorder your memories. Click to view.</p>
        </div>
      </div>

      <Reorder.Group 
        axis="y" 
        values={items} 
        onReorder={onReorder} 
        className="flex flex-col gap-4"
      >
        {items.map((item, index) => (
          <Reorder.Item 
            key={item.id} 
            value={item} 
            className="group relative flex flex-col md:flex-row items-stretch gap-6 bg-zinc-900/50 hover:bg-zinc-800/80 border border-zinc-800 p-4 rounded-lg cursor-grab active:cursor-grabbing transition-colors"
          >
            {/* Drag Handle */}
            <div className="flex items-center text-zinc-600 group-hover:text-zinc-400 pl-2">
              <GripVertical size={20} />
            </div>

            {/* Thumbnail */}
            <div 
              className="w-full md:w-48 h-32 flex-shrink-0 cursor-pointer overflow-hidden rounded-md bg-black"
              onClick={() => onSelect(index)}
            >
              <img 
                src={item.src} 
                alt={item.title} 
                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" 
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Content */}
            <div 
              className="flex-1 flex flex-col justify-center py-2 cursor-pointer"
              onClick={() => onSelect(index)}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-serif tracking-widest text-white">{item.title}</h3>
                <span className="text-xs uppercase tracking-widest text-zinc-500 border border-zinc-800 px-3 py-1 rounded-full">{item.tag}</span>
              </div>
              <p className="text-sm text-zinc-400 font-light leading-relaxed line-clamp-2 max-w-2xl">{item.desc}</p>
            </div>
            
            {/* Index Label */}
            <div className="absolute top-4 right-4 text-xs font-mono text-zinc-700">
              #{String(index + 1).padStart(2, '0')}
            </div>
          </Reorder.Item>
        ))}
      </Reorder.Group>
    </div>
  );
}
