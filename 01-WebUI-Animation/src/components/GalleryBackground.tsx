import React, { useEffect, useRef } from 'react';

export default function GalleryBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animationFrameId: number;
    let particles: any[] = [];
    const numParticles = 7000; // Much denser background
    let rotationAngle = 0;

    // Create nebula clusters for irregular distribution
    const clusters = Array.from({ length: 20 }, () => ({
      x: (Math.random() - 0.5) * 4000,
      y: (Math.random() - 0.5) * 4000,
      z: (Math.random() - 0.5) * 4000,
      radius: 400 + Math.random() * 1000
    }));

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.scale(dpr, dpr);
    };

    const resetParticle = (p: any) => {
      // 75% of particles belong to a cluster (nebula), 25% are uniformly distributed
      if (Math.random() < 0.75) {
        const c = clusters[Math.floor(Math.random() * clusters.length)];
        // Random point within a sphere (biased towards center for denser core)
        const r = Math.pow(Math.random(), 2) * c.radius; 
        const theta = Math.random() * 2 * Math.PI;
        const phi = Math.acos(2 * Math.random() - 1);
        
        p.x = c.x + r * Math.sin(phi) * Math.cos(theta);
        p.y = c.y + r * Math.sin(phi) * Math.sin(theta);
        p.z = c.z + r * Math.cos(phi);
      } else {
        p.x = (Math.random() - 0.5) * 4000;
        p.y = (Math.random() - 0.5) * 4000;
        p.z = (Math.random() - 0.5) * 4000;
      }

      // Very slow ambient drift
      p.vx = (Math.random() - 0.5) * 0.2;
      p.vy = (Math.random() - 0.5) * 0.2;
      p.vz = (Math.random() - 0.5) * 0.2;
      p.size = Math.random() * 0.4 + 0.1; // All particles are very fine
      p.baseAlpha = Math.random() * 0.5 + 0.1;
      p.color = Math.random() > 0.8 ? '180, 230, 255' : '255, 255, 255';
    };

    const init = () => {
      particles = [];
      for (let i = 0; i < numParticles; i++) {
        const p = {} as any;
        resetParticle(p);
        particles.push(p);
      }
    };

    const animate = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      ctx.fillStyle = '#050505';
      ctx.fillRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;
      const fl = 1000; // focal length

      // Extremely slow global rotation
      rotationAngle += 0.0005;
      const cosA = Math.cos(rotationAngle);
      const sinA = Math.sin(rotationAngle);

      particles.forEach(p => {
        // Slow ambient movement
        p.x += p.vx;
        p.y += p.vy;
        p.z += p.vz;

        // Wrap around if they drift too far
        if (p.x > 2000) p.x -= 4000;
        if (p.x < -2000) p.x += 4000;
        if (p.y > 2000) p.y -= 4000;
        if (p.y < -2000) p.y += 4000;
        if (p.z > 2000) p.z -= 4000;
        if (p.z < -2000) p.z += 4000;

        // Rotate around Y axis
        const rx = p.x * cosA - p.z * sinA;
        const rz = p.z * cosA + p.x * sinA;
        
        // Translate Z to put particles in front of camera
        const tz = rz + 1500;

        if (tz > 0) {
          const scale = fl / tz;
          const x2d = cx + rx * scale;
          const y2d = cy + p.y * scale;

          // Only draw if within screen bounds
          if (x2d > -50 && x2d < width + 50 && y2d > -50 && y2d < height + 50) {
            // Fade out particles that are too far or too close
            const alpha = Math.min(1, p.baseAlpha * (3000 - tz) / 2000);
            if (alpha > 0.01) {
              ctx.fillStyle = `rgba(${p.color}, ${alpha})`;
              ctx.beginPath();
              ctx.arc(x2d, y2d, p.size * scale, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    window.addEventListener('resize', resize);

    resize();
    init();
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none blur-[2px] opacity-80" />;
}
