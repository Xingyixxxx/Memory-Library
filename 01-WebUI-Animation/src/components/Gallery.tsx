import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, LayoutGrid, Clock, Edit2 } from 'lucide-react';
import GalleryBackground from './GalleryBackground';
import ImageParticles from './ImageParticles';
import OverviewGrid from './OverviewGrid';
import NotebookGallery from './NotebookGallery';
import EditModal, { EditModalData } from './EditModal';

// Sample Theme Books Initial Data
const initialThemeBooks = [
  {
    id: 1,
    title: 'The Great Expedition',
    date: 'Summer 2026',
    coverSrc: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&h=800&auto=format&fit=crop',
    tag: 'Journey',
    desc: 'Into the unknown we went, seeking paths untrodden.',
    memories: [
      { id: 101, title: 'Departure', tag: 'Day 1', desc: 'The very first steps towards the wild unknown, feeling the crisp morning air.', src: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=1200&auto=format&fit=crop' },
      { id: 102, title: 'Deep Forest', tag: 'Day 3', desc: 'Surrounded by ancient giants. The sunlight barely pierced the thick canopy above.', src: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?q=80&w=1200&auto=format&fit=crop' },
      { id: 103, title: 'Summit View', tag: 'Day 7', desc: 'We finally reached the top. The world seemed so small from up here.', src: 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?q=80&w=1200&auto=format&fit=crop' }
    ]
  },
  {
    id: 2,
    title: 'Silent Echoes',
    date: 'Autumn 2026',
    coverSrc: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=600&h=800&auto=format&fit=crop',
    tag: 'Cityscape',
    desc: 'Whispers in the dark. Listening to the silence of the city.',
    memories: [
      { id: 201, title: 'Golden Hour', tag: 'Dusk', desc: 'The skyline caught fire as the sun dipped behind the concrete horizon.', src: 'https://images.unsplash.com/photo-1449034446853-66c86144b0ad?q=80&w=1200&auto=format&fit=crop' },
      { id: 202, title: 'Night Walk', tag: 'Midnight', desc: 'Neon reflections on the rain-slicked pavement. An empty street breathing quietly.', src: 'https://images.unsplash.com/photo-1480796927426-f609979314bd?q=80&w=1200&auto=format&fit=crop' },
      { id: 203, title: 'Cybernetic Alley', tag: 'Late Night', desc: 'Lost in the digital hum of endless alleys and overflowing wires.', src: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=1200&auto=format&fit=crop' }
    ]
  },
  {
    id: 3,
    title: 'Neon Dreams',
    date: 'Winter 2026',
    coverSrc: 'https://images.unsplash.com/photo-1507608616759-54f48f0af0ee?q=80&w=600&h=800&auto=format&fit=crop',
    tag: 'Nightlife',
    desc: 'City lights and shadows intersecting through the cold rain.',
    memories: [
      { id: 301, title: 'Rain Drops', tag: 'Rainy', desc: 'Watching the city weep through the condensation of a late night diner window.', src: 'https://images.unsplash.com/photo-1517502884422-41eaead166d4?q=80&w=1200&auto=format&fit=crop' }
    ]
  },
  {
    id: 4,
    title: 'Lost Horizons',
    date: 'Spring 2027',
    coverSrc: 'https://images.unsplash.com/photo-1518640467707-6811f4a6ab73?q=80&w=600&h=800&auto=format&fit=crop',
    tag: 'Abstract',
    desc: 'Beyond the edge, finding new paths and undiscovered worlds.',
    memories: []
  },
  {
    id: 5,
    title: 'Ethereal',
    date: 'Summer 2027',
    coverSrc: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=600&h=800&auto=format&fit=crop',
    tag: 'Minimal',
    desc: 'Fading into the void of peaceful memories.',
    memories: []
  },
];

export default function Gallery() {
  const [themeBooks, setThemeBooks] = useState(initialThemeBooks);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'timeline' | 'overview'>('timeline');
  const [activeBookId, setActiveBookId] = useState<number | null>(null);

  const [modalState, setModalState] = useState<{ isOpen: boolean; mode: 'add' | 'edit'; data?: EditModalData }>({
    isOpen: false,
    mode: 'add'
  });

  const next = () => setCurrentIndex(prev => Math.min(prev + 1, themeBooks.length - 1));
  const prev = () => setCurrentIndex(prev => Math.max(prev - 1, 0));

  const updateBook = (updatedBook: any) => {
    setThemeBooks(prev => prev.map(bk => bk.id === updatedBook.id ? updatedBook : bk));
  };

  const handleSaveBook = (data: EditModalData) => {
    if (modalState.mode === 'add') {
      setThemeBooks([
        ...themeBooks,
        {
          id: data.id || Date.now(),
          title: data.title,
          tag: data.tag,
          date: data.tag,
          desc: data.desc,
          coverSrc: data.src,
          memories: []
        }
      ]);
      setCurrentIndex(themeBooks.length);
    } else {
      setThemeBooks(themeBooks.map(bk => bk.id === data.id ? { ...bk, title: data.title, tag: data.tag, date: data.tag, desc: data.desc, coverSrc: data.src } : bk));
    }
  };

  // If a book is active, render Level 2 Gallery
  if (activeBookId !== null) {
    const activeBook = themeBooks.find(b => b.id === activeBookId);
    if (activeBook) {
      return (
        <NotebookGallery
          key="notebook-gallery"
          book={activeBook}
          onUpdate={updateBook}
          onBack={() => setActiveBookId(null)}
        />
      );
    }
  }

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center pt-8 md:pt-16 pb-32 overflow-hidden relative">
      {/* 3D Particle Background */}
      <GalleryBackground />

      {/* Header & Controls for Level 1 */}
      <div className="w-full max-w-7xl px-8 flex justify-between items-center z-50 mt-4 h-12">
        <div>
          <h1 className="text-xl font-serif text-white tracking-[0.2em] uppercase">Memory Museum</h1>
          <p className="text-zinc-500 font-light tracking-widest text-xs mt-1">Theme Collections</p>
        </div>

        {/* Toggle Mode */}
        <div className="flex bg-zinc-900 border border-zinc-800 rounded-full p-1 overflow-hidden shadow-lg">
          <button
            onClick={() => setViewMode('timeline')}
            className={`flex items-center gap-2 px-6 py-2 rounded-full text-xs uppercase tracking-widest transition-colors ${viewMode === 'timeline' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            <Clock size={14} /> Timeline
          </button>
          <button
            onClick={() => setViewMode('overview')}
            className={`flex items-center gap-2 px-6 py-2 rounded-full text-xs uppercase tracking-widest transition-colors ${viewMode === 'overview' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            <LayoutGrid size={14} /> Reorder Layout
          </button>
        </div>
      </div>

      <div className="relative z-10 flex flex-col w-full px-6 min-h-[700px] mt-12 flex-1">
        <AnimatePresence mode="wait">
          {viewMode === 'timeline' ? (
            <motion.div
              key="timeline"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              className="relative w-full h-full flex justify-center items-center flex-1 [perspective:2400px]"
            >
              {/* Zero Slant container for true forward-facing 3D camera */}
              <motion.div
                className="relative w-[320px] h-[450px] flex items-center justify-center transform-style-3d will-change-transform"
              >
                {themeBooks.map((book, i) => {
                  const diff = i - currentIndex;
                  const absDiff = Math.abs(diff);
                  const isActive = diff === 0;

                  // Z轴：前后错落。未来的卡片深埋于后，过去的卡片在前方。
                  // 近大远小，靠 Z 轴负值在 perspective 环境下自动缩放呈现
                  const distanceBetweenNodes = 600;
                  const zOffset = diff * -distanceBetweenNodes;

                  // X轴：往左是过去 (diff < 0 => x < 0)，往右是未来 (diff > 0 => x > 0)
                  // 基础斜线分布：每个节点向右推进 280px
                  const linearX = diff * 300;

                  // 叠加一点缓和的正弦波，使其带有 S 型 / Z 字型的自然蜿蜒
                  const waveX = Math.sin(diff * 1.5) * 120;

                  // 最终的 X 偏移
                  let xOffset = linearX + waveX;

                  // Y轴：稍微给未来节点一点点向下沉浸的稳定感，使得它像一条铺开的长路
                  const yOffset = diff * 15;

                  const scale = isActive ? 0.9 : 0.5;

                  // 透明度控制
                  let visibilityOpacity = 1;
                  if (isActive) visibilityOpacity = 1;
                  else if (diff > 0) {
                    // 未来的卡片远去，逐渐变暗
                    visibilityOpacity = Math.max(1 - (diff * 0.15), 0.35);
                  } else {
                    // 过去的卡片在左边，靠近镜头甚至超出身后，快速淡出
                    visibilityOpacity = Math.max(1 + (diff * 0.6), 0);
                  }

                  return (
                    <motion.div
                      key={book.id}
                      className="absolute inset-0 cursor-pointer group"
                      style={{
                        transformOrigin: '50% 50%',
                        zIndex: themeBooks.length - i,
                        pointerEvents: Math.abs(diff) > 2 ? 'none' : 'auto',
                      }}
                      initial={false}
                      animate={{
                        x: xOffset,
                        z: zOffset,
                        y: yOffset,
                        rotateY: 0,
                        rotateX: 0,
                        scale: scale,
                        opacity: visibilityOpacity,
                        filter: isActive ? 'brightness(1.1) drop-shadow(0 20px 40px rgba(0,255,255,0.4))' : 'brightness(0.65)',
                      }}
                      transition={{
                        type: 'spring',
                        stiffness: 45,
                        damping: 20,
                        mass: 0.8
                      }}
                      onClick={(e) => {
                        if ((e.target as HTMLElement).closest('.edit-btn')) return;

                        if (!isActive) {
                          setCurrentIndex(i);
                        } else {
                          setActiveBookId(book.id);
                        }
                      }}
                    >
                      <div className="relative w-full h-full flex flex-col items-center justify-end transform-style-3d">

                        <div className="relative w-full h-full transform-style-3d group">
                          {isActive && (
                            <button
                              onClick={() => setModalState({ isOpen: true, mode: 'edit', data: { id: book.id, title: book.title, tag: book.date, desc: book.desc, src: book.coverSrc } })}
                              className="edit-btn absolute top-4 right-4 z-50 bg-black/50 hover:bg-black p-2 rounded-full text-zinc-400 hover:text-cyan-400 transition-colors backdrop-blur-md border border-white/10 opacity-0 group-hover:opacity-100"
                            >
                              <Edit2 size={16} />
                            </button>
                          )}
                          <img
                            src={book.coverSrc}
                            alt={book.title}
                            className={`w-full h-full object-cover transition-all duration-1000 ${isActive ? 'grayscale-0 scale-100' : 'grayscale opacity-50 scale-95'}`}
                            style={{
                              maskImage: 'radial-gradient(ellipse at center, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 70%)',
                              WebkitMaskImage: 'radial-gradient(ellipse at center, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 70%)'
                            }}
                            referrerPolicy="no-referrer"
                          />
                          <div className={`absolute inset-0 pointer-events-none transition-opacity duration-1000 ${isActive ? 'opacity-100' : 'opacity-60'}`}>
                            <ImageParticles isActive={true} seed={book.id} src={book.coverSrc} />
                          </div>
                        </div>

                        {/* Title Platform positioned elegantly underneath */}
                        <div className={`absolute -bottom-28 left-1/2 -translate-x-1/2 w-[250%] text-center transition-all duration-1000 transform-style-3d ${isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'}`}>
                          <h2 className="text-white font-serif text-3xl tracking-[0.3em] uppercase drop-shadow-md text-glow">{book.title}</h2>
                          <div className="w-12 h-[1px] bg-cyan-700/50 my-6 mx-auto" />
                          <p className="text-zinc-300 text-xs tracking-[0.2em] uppercase mb-3">{book.date}</p>
                          <p className="text-zinc-500/90 text-sm tracking-[0.1em] max-w-sm mx-auto leading-loose font-light">{book.desc}</p>

                          <p className="mt-8 text-cyan-600 text-[10px] tracking-[0.3em] uppercase hover:text-cyan-400 animate-pulse cursor-pointer transition-colors duration-300">
                            Click to Open Album
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>

              {/* Navigation Arrows */}
              {currentIndex > 0 && (
                <div
                  className="fixed top-1/2 left-4 md:left-12 -translate-y-1/2 z-50 cursor-pointer group p-4"
                  onClick={prev}
                >
                  <ChevronLeft className="w-10 h-10 text-white/30 group-hover:text-white/80 transition-all duration-300 transform group-hover:-translate-x-2" />
                </div>
              )}
              {currentIndex < themeBooks.length - 1 && (
                <div
                  className="fixed top-1/2 right-4 md:right-12 -translate-y-1/2 z-50 cursor-pointer group p-4"
                  onClick={next}
                >
                  <ChevronRight className="w-10 h-10 text-white/30 group-hover:text-white/80 transition-all duration-300 transform group-hover:translate-x-2" />
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              transition={{ duration: 0.6 }}
              className="absolute inset-0 overflow-y-auto no-scrollbar"
            >
              <OverviewGrid
                items={themeBooks}
                onReorder={setThemeBooks}
                onSelect={(idx) => {
                  setCurrentIndex(idx);
                  setViewMode('timeline');
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <EditModal
        isOpen={modalState.isOpen}
        mode={modalState.mode}
        type="book"
        initialData={modalState.data}
        onClose={() => setModalState({ ...modalState, isOpen: false })}
        onSave={handleSaveBook}
      />
    </div>
  );
}
