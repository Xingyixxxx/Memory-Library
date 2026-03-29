import React, { useState } from 'react';
import { motion, Reorder } from 'motion/react';
import { ChevronLeft, Plus, GripVertical, Edit2 } from 'lucide-react';
import EditModal, { EditModalData } from './EditModal';

interface NotebookGalleryProps {
  book: any;
  onUpdate: (updatedBook: any) => void;
  onBack: () => void;
}

export default function NotebookGallery({ book, onUpdate, onBack }: NotebookGalleryProps) {
  const [modalState, setModalState] = useState<{ isOpen: boolean; mode: 'add' | 'edit'; data?: EditModalData }>({
    isOpen: false,
    mode: 'add'
  });

  const handleSaveMemory = (data: EditModalData) => {
    if (modalState.mode === 'add') {
      onUpdate({
        ...book,
        memories: [...book.memories, data]
      });
    } else {
      onUpdate({
        ...book,
        memories: book.memories.map((m: any) => m.id === data.id ? data : m)
      });
    }
  };

  const handleReorder = (reorderedMemories: any[]) => {
    onUpdate({
      ...book,
      memories: reorderedMemories
    });
  };

  return (
    <motion.div 
      className="min-h-screen bg-black w-full flex flex-col relative"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-zinc-900 px-6 md:px-12 pt-16 pb-6 flex justify-between items-end">
        <div>
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mb-4 text-sm tracking-widest uppercase"
          >
            <ChevronLeft size={16} /> Back to Library
          </button>
          <h1 className="text-3xl md:text-5xl font-serif text-white tracking-[0.1em]">{book.title}</h1>
          <p className="text-zinc-500 font-light tracking-widest text-sm mt-3">{book.date} — {book.memories.length} Memories</p>
        </div>
        
        <button 
          onClick={() => setModalState({ isOpen: true, mode: 'add' })}
          className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-5 py-3 rounded-full text-white text-xs uppercase tracking-widest transition-all shadow-lg hover:shadow-cyan-900/20"
        >
          <Plus size={16} /> Add Memory
        </button>
      </div>

      {/* Vertical Waterfall / Reorder List */}
      <div className="flex-1 w-full mt-12 px-6 py-12 flex flex-col items-center overflow-x-hidden">
        {book.memories.length === 0 ? (
          <div className="text-center text-zinc-600 mt-32 tracking-widest uppercase font-light">
            This notebook is empty.
          </div>
        ) : (
          <Reorder.Group 
            axis="y" 
            values={book.memories} 
            onReorder={handleReorder} 
            className="w-full flex flex-col gap-32 md:gap-[40vh]"
          >
            {book.memories.map((memory: any) => (
              <Reorder.Item 
                key={memory.id} 
                value={memory} 
                className="group relative w-full flex justify-center items-center"
              >
                <div className="flex flex-col md:flex-row items-center justify-center w-full max-w-6xl gap-12 md:gap-20">
                  
                  {/* Tools container positioned absolutely on the left on desktop */}
                  <div className="absolute left-4 top-4 md:left-8 md:top-1/2 md:-translate-y-1/2 flex flex-row md:flex-col gap-4 opacity-0 group-hover:opacity-100 transition-opacity z-50">
                    <button 
                      className="text-zinc-600 hover:text-white cursor-grab active:cursor-grabbing p-2 transition-colors bg-black/40 md:bg-transparent rounded-full"
                      title="Drag to reorder"
                    >
                      <GripVertical size={24} />
                    </button>
                    <button 
                      onClick={() => setModalState({ isOpen: true, mode: 'edit', data: memory })}
                      className="text-zinc-600 hover:text-cyan-400 p-2 transition-colors bg-black/40 md:bg-transparent rounded-full"
                      title="Edit memory"
                    >
                      <Edit2 size={22} />
                    </button>
                  </div>

                  {/* Image container: mid-left */}
                  <div className="flex-1 w-full flex justify-center md:justify-end items-center relative z-20">
                    <motion.img
                      src={memory.src}
                      alt={memory.title}
                      className="max-h-[85vh] w-auto max-w-[90vw] md:max-w-xl object-contain drop-shadow-2xl"
                      referrerPolicy="no-referrer"
                      initial={{ opacity: 0, x: -30 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: false, margin: "-20%" }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                  </div>

                  {/* Text container: right */}
                  <div className="flex-1 w-full flex flex-col justify-center text-left max-w-lg px-6 md:px-0">
                    <motion.div 
                      initial={{ opacity: 0, x: 30 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: false, margin: "-20%" }}
                      transition={{ duration: 0.8, delay: 0.2 }}
                      className="flex flex-col gap-6"
                    >
                      <div>
                        <h2 className="text-white font-serif text-3xl md:text-5xl tracking-[0.1em] mb-4 drop-shadow-md">
                          {memory.title}
                        </h2>
                        <div className="w-16 h-[1px] bg-white/20 mb-5" />
                        <span className="inline-block border border-zinc-800 text-zinc-500 text-xs tracking-[0.2em] uppercase px-4 py-1.5 rounded-full">
                          {memory.tag}
                        </span>
                      </div>
                      
                      <p className="text-zinc-400/90 text-sm md:text-base tracking-[0.05em] leading-relaxed font-light whitespace-pre-line">
                        {memory.desc}
                      </p>
                    </motion.div>
                  </div>
                  
                </div>
              </Reorder.Item>
            ))}
          </Reorder.Group>
        )}
      </div>

      <EditModal 
        isOpen={modalState.isOpen} 
        mode={modalState.mode}
        type="memory"
        initialData={modalState.data}
        onClose={() => setModalState({ ...modalState, isOpen: false })} 
        onSave={handleSaveMemory} 
      />
    </motion.div>
  );
}
