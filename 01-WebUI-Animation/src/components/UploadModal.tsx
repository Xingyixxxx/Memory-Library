import React, { useState, useRef } from 'react';
import { X, Upload, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newItem: any) => void;
}

export default function UploadModal({ isOpen, onClose, onSave }: UploadModalProps) {
  const [title, setTitle] = useState('');
  const [tag, setTag] = useState('');
  const [desc, setDesc] = useState('');
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      id: Date.now(),
      title,
      tag: tag || new Date().toLocaleDateString(),
      desc,
      src: previewSrc
    });
    
    // Reset state
    setTitle('');
    setTag('');
    setDesc('');
    setPreviewSrc(null);
    onClose();
  };

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
            className="bg-zinc-900 border border-zinc-700/50 p-6 md:p-8 w-[90%] max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col md:flex-row gap-8 shadow-2xl"
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            {/* Close Button */}
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>

            {/* Left: Image Upload Area */}
            <div className="flex-1 flex flex-col items-center justify-center min-h-[300px] border-2 border-dashed border-zinc-700/50 hover:border-zinc-500 transition-colors bg-black/30 relative">
              <input 
                type="file" 
                accept="image/*" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
              />
              {previewSrc ? (
                <div className="w-full h-full relative cursor-pointer group" onClick={() => fileInputRef.current?.click()}>
                  <img src={previewSrc} alt="Preview" className="w-full h-full object-contain" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <span className="text-white flex items-center gap-2"><Upload size={18} /> Replace Image</span>
                  </div>
                </div>
              ) : (
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-full flex flex-col items-center justify-center gap-4 text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  <ImageIcon size={48} strokeWidth={1} />
                  <span>Click to select image</span>
                </button>
              )}
            </div>

            {/* Right: Text Information */}
            <div className="flex-1 flex flex-col justify-center space-y-6">
              <div>
                <h3 className="text-2xl font-serif tracking-widest uppercase text-white mb-2">New Memory</h3>
                <p className="text-zinc-500 text-sm">Upload a photo and attach your sentiments.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-zinc-400 mb-1">Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="E.g., Summer of 2026"
                    className="w-full bg-black/50 border border-zinc-800 focus:border-cyan-900/50 px-4 py-2 text-white outline-none transition-colors placeholder:text-zinc-700"
                  />
                </div>
                
                <div>
                  <label className="block text-xs uppercase tracking-widest text-zinc-400 mb-1">Date / Tag</label>
                  <input
                    type="text"
                    value={tag}
                    onChange={(e) => setTag(e.target.value)}
                    placeholder="E.g., Aug 15th, 2026 or 'Vacation'"
                    className="w-full bg-black/50 border border-zinc-800 focus:border-cyan-900/50 px-4 py-2 text-white outline-none transition-colors placeholder:text-zinc-700"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest text-zinc-400 mb-1">Description</label>
                  <textarea
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    placeholder="Write a short memory description..."
                    rows={4}
                    className="w-full bg-black/50 border border-zinc-800 focus:border-cyan-900/50 px-4 py-2 text-white outline-none transition-colors resize-none placeholder:text-zinc-700 leading-relaxed font-light"
                  />
                </div>
              </div>

              <button 
                onClick={handleSave}
                className="mt-6 w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-medium uppercase tracking-[0.2em] text-sm transition-colors border border-zinc-700 hover:border-zinc-500"
              >
                Deposit Memory
              </button>
            </div>
            
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
