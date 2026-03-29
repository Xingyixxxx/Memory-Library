import React, { useEffect, useRef } from 'react';

export default function ImageParticles({ isActive, seed, src }: { isActive: boolean, seed: number, src: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    let animationFrameId: number;
    const particles: any[] = [];
    const numParticles = 10000; // Clearer, rhythmic particles

    const imgWidth = 320;
    const imgHeight = 450;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = src;

    img.onload = () => {
      // 1. Extract colors from the image
      const offCanvas = document.createElement('canvas');
      offCanvas.width = imgWidth;
      offCanvas.height = imgHeight;
      const offCtx = offCanvas.getContext('2d');
      if (!offCtx) return;

      // Draw image to cover the offscreen canvas
      const scale = Math.max(imgWidth / img.width, imgHeight / img.height);
      const x = (imgWidth / 2) - (img.width / 2) * scale;
      const y = (imgHeight / 2) - (img.height / 2) * scale;
      offCtx.drawImage(img, x, y, img.width * scale, img.height * scale);

      let imageData: Uint8ClampedArray | null = null;
      try {
        imageData = offCtx.getImageData(0, 0, imgWidth, imgHeight).data;
      } catch (e) {
        console.warn("CORS issue with image, using fallback colors");
      }

      // 2. Initialize particles
      for (let i = 0; i < numParticles; i++) {
        const angle = Math.random() * Math.PI * 2; // Uniform distribution
        
        // Distribute particles deeper inside the image to obscure the boundary (25% to 75%)
        const radiusBand = 0.25 + Math.random() * 0.5; 
        
        let r = 180, g = 230, b = 255; // Fallback cyan-ish

        if (imageData) {
          // Map polar coordinates back to image pixels to sample color
          const px = Math.floor(imgWidth / 2 + Math.cos(angle) * (imgWidth / 2) * radiusBand);
          const py = Math.floor(imgHeight / 2 + Math.sin(angle) * (imgHeight / 2) * radiusBand);
          
          const safePx = Math.max(0, Math.min(imgWidth - 1, px));
          const safePy = Math.max(0, Math.min(imgHeight - 1, py));
          
          const pixelIndex = (safePy * imgWidth + safePx) * 4;
          r = imageData[pixelIndex];
          g = imageData[pixelIndex + 1];
          b = imageData[pixelIndex + 2];
        }

        particles.push({
          angle,
          baseRadiusBand: radiusBand,
          r, g, b,
          size: Math.random() * 1.0 + 0.5, // Clearer, slightly larger particles
          life: Math.random(), // 0 to 1
          speed: 0.001 + Math.random() * 0.002, // Slow drift
          waveOffset: Math.random() * Math.PI * 2,
          waveSpeed: 0.5 + Math.random() * 1.0
        });
      }

      // 3. Animate
      const animate = () => {
        const dpr = window.devicePixelRatio || 1;
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        
        if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
          canvas.width = width * dpr;
          canvas.height = height * dpr;
          ctx.scale(dpr, dpr);
        }

        ctx.clearRect(0, 0, width, height);

        const cx = width / 2;
        const cy = height / 2;
        const time = Date.now() * 0.0015 + seed * 10;

        const activeMultiplier = isActive ? 1 : 0.15;

        particles.forEach((p, i) => {
          // Optimization: Draw fewer particles for inactive items to maintain performance
          if (!isActive && i % 4 !== 0) return;

          // Update life cycle
          p.life += p.speed * (isActive ? 1 : 0.3);
          if (p.life > 1) p.life = 0;

          // Outward drift: particles move outwards as they age
          const currentBand = p.baseRadiusBand + (p.life * 0.4 * activeMultiplier);
          
          // Smooth, rhythmic wave motion
          const waveFreq1 = 3;
          const waveFreq2 = 5;
          const waveAmplitude = 25 * activeMultiplier * p.life; 
          
          const rawWave = Math.sin(time * p.waveSpeed + p.angle * waveFreq1) 
                        + Math.cos(time * p.waveSpeed * 0.8 + p.angle * waveFreq2) * 0.5;

          const wave = rawWave * waveAmplitude;

          const rx = (imgWidth / 2) * currentBand + wave;
          const ry = (imgHeight / 2) * currentBand + wave;

          const px = cx + Math.cos(p.angle) * rx;
          const py = cy + Math.sin(p.angle) * ry;

          // Opacity curve: fade in quickly, stay, fade out slowly
          let alpha = 0;
          if (p.life < 0.15) alpha = p.life / 0.15;
          else if (p.life < 0.7) alpha = 1;
          else alpha = 1 - ((p.life - 0.7) / 0.3);

          alpha *= (isActive ? 0.95 : 0.2); // Overall opacity based on active state

          ctx.fillStyle = `rgba(${p.r}, ${p.g}, ${p.b}, ${alpha})`;
          ctx.beginPath();
          ctx.arc(px, py, p.size, 0, Math.PI * 2);
          ctx.fill();
        });

        animationFrameId = requestAnimationFrame(animate);
      };

      animate();
    };

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [isActive, seed, src]);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[650px] pointer-events-none z-20"
    />
  );
}
