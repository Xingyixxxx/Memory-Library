import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface EditModalData {
  id?: number;
  title: string;
  tag: string; // Used as Date for ThemeBooks
  desc: string;
  src: string; // Used as coverSrc for ThemeBooks
}

interface EditModalProps {
  isOpen: boolean;
  mode: 'add' | 'edit';
  type: 'book' | 'memory';
  initialData?: EditModalData;
  onClose: () => void;
  onSave: (data: EditModalData) => void;
}

export default function EditModal({ isOpen, mode, type, initialData, onClose, onSave }: EditModalProps) {
  const [title, setTitle] = useState('');
  const [tag, setTag] = useState('');
  const [desc, setDesc] = useState('');
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && initialData && mode === 'edit') {
      setTitle(initialData.title || '');
      setTag(initialData.tag || '');
      setDesc(initialData.desc || '');
      setPreviewSrc(initialData.src || null);
    } else if (isOpen && mode === 'add') {
      setTitle('');
      setTag('');
      setDesc('');
      setPreviewSrc(null);
    }
  }, [isOpen, initialData, mode]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      setPreviewSrc(url);
    }
  };

  const handleSave = () => {
    if (!title || !previewSrc) {
      alert("Please provide an image and a title.");
      return;
    }
    onSave({
      id: initialData?.id || Date.now(),
      title,
      tag: tag || new Date().toLocaleDateString(),
      desc,
      src: previewSrc
    });
    
    onClose();
  };

  const formTitle = mode === 'add' 
    ? (type === 'book' ? 'New Theme Book' : 'New Memory')
    : (type === 'book' ? 'Edit Theme Book' : 'Edit Memory');

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-[#0a0a0a] border border-zinc-800/80 p-6 md:p-8 w-[90%] max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col md:flex-row gap-8 shadow-2xl relative"
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            {/* Close Button */}
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors z-10"
            >
              <X size={24} />
            </button>

            {/* Left: Image Upload Area */}
            <div className={`flex-1 flex flex-col items-center justify-center min-h-[300px] border border-dashed border-zinc-700/50 hover:border-zinc-500 transition-colors bg-black/40 relative ${type === 'book' ? 'aspect-[320/450] max-w-[320px] mx-auto' : ''}`}>
              <input 
                type="file" 
                accept="image/*" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
              />
              {previewSrc ? (
                <div className="w-full h-full relative cursor-pointer group flex items-center justify-center" onClick={() => fileInputRef.current?.click()}>
                  <img src={previewSrc} alt="Preview" className={`object-cover w-full h-full ${type === 'book' ? '' : 'object-contain'}`} />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <span className="text-white flex items-center gap-2 text-sm uppercase tracking-widest bg-black/50 px-4 py-2 rounded"><Upload size={16} /> Replace Image</span>
                  </div>
                </div>
              ) : (
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-full flex flex-col items-center justify-center gap-4 text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  <ImageIcon size={48} strokeWidth={1} />
                  <span className="text-sm tracking-widest uppercase">Select {type === 'book' ? 'Cover' : 'Image'}</span>
                </button>
              )}
            </div>

            {/* Right: Text Information */}
            <div className="flex-1 flex flex-col justify-center space-y-6">
              <div>
                <h3 className="text-2xl font-serif tracking-widest uppercase text-white mb-2">{formTitle}</h3>
                <p className="text-zinc-500 text-xs tracking-widest uppercase">Modify your data below.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-1.5">Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter a title..."
                    className="w-full bg-black/50 border border-zinc-800 focus:border-cyan-900/50 px-4 py-2.5 text-white outline-none transition-colors placeholder:text-zinc-700 text-sm font-light"
                  />
                </div>
                
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-1.5">{type === 'book' ? 'Date' : 'Tag / Date'}</label>
                  <input
                    type="text"
                    value={tag}
                    onChange={(e) => setTag(e.target.value)}
                    placeholder="Enter a tag or date..."
                    className="w-full bg-black/50 border border-zinc-800 focus:border-cyan-900/50 px-4 py-2.5 text-white outline-none transition-colors placeholder:text-zinc-700 text-sm font-light uppercase tracking-widest"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-1.5">Description</label>
                  <textarea
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    placeholder="Write a short description..."
                    rows={4}
                    className="w-full bg-black/50 border border-zinc-800 focus:border-cyan-900/50 px-4 py-2.5 text-white outline-none transition-colors resize-none placeholder:text-zinc-700 leading-relaxed font-light text-sm"
                  />
                </div>
              </div>

              <button 
                onClick={handleSave}
                className="mt-6 w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-medium uppercase tracking-[0.2em] text-xs transition-colors border border-zinc-700 hover:border-zinc-500"
              >
                Save Details
              </button>
            </div>
            
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
