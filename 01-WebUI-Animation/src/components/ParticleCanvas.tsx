import React, { useEffect, useRef } from 'react';

class Particle {
  x: number;
  y: number;
  originX: number;
  originY: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  angle: number;
  radius: number;
  speed: number;
  baseAlpha: number;

  constructor(x: number, y: number, color: string, baseAlpha: number) {
    this.x = x;
    this.y = y;
    this.originX = x;
    this.originY = y;
    this.vx = 0;
    this.vy = 0;
    this.color = color;
    this.size = Math.random() * 1.5 + 0.5;
    this.angle = Math.random() * Math.PI * 2;
    this.radius = Math.random() * 15;
    this.speed = Math.random() * 0.01 + 0.002;
    this.baseAlpha = baseAlpha;
  }

  update(mouseX: number, mouseY: number) {
    this.angle += this.speed;
    
    const floatX = Math.cos(this.angle) * this.radius;
    const floatY = Math.sin(this.angle) * this.radius;

    let dx = mouseX - this.x;
    let dy = mouseY - this.y;
    let distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < 120) {
      const force = (120 - distance) / 120;
      this.vx -= (dx / distance) * force * 0.8;
      this.vy -= (dy / distance) * force * 0.8;
    }

    this.x += this.vx;
    this.y += this.vy;

    this.vx *= 0.92;
    this.vy *= 0.92;

    this.x += (this.originX + floatX - this.x) * 0.03;
    this.y += (this.originY + floatY - this.y) * 0.03;
  }

  draw(ctx: CanvasRenderingContext2D) {
    const dx = this.x - this.originX;
    const dy = this.y - this.originY;
    const dist = Math.sqrt(dx*dx + dy*dy);
    const alpha = Math.max(0.05, this.baseAlpha - (dist * 0.005));

    ctx.fillStyle = this.color.replace('ALPHA', alpha.toString());
    ctx.fillRect(this.x, this.y, this.size, this.size);
  }
}

export default function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];
    let mouseX = -1000;
    let mouseY = -1000;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      initParticles();
    };

    const initParticles = () => {
      particles = [];
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      
      for (let i = 0; i < 15000; i++) {
        const cluster = Math.random();
        let cx = centerX;
        let cy = centerY;
        let maxRadius = 160;

        if (cluster < 0.35) {
          cx -= 90;
          cy -= 30;
          maxRadius = 130;
        } else if (cluster < 0.7) {
          cx += 100;
          cy += 20;
          maxRadius = 140;
        } else if (cluster < 0.85) {
          cx -= 30;
          cy += 90;
          maxRadius = 120;
        } else {
          cx += 30;
          cy -= 80;
          maxRadius = 110;
        }

        const angle = Math.random() * Math.PI * 2;
        const radius = Math.pow(Math.random(), 0.6) * maxRadius;
        
        const x = cx + Math.cos(angle) * radius;
        const y = cy + Math.sin(angle) * radius;

        const r = Math.floor(80 + Math.random() * 80);
        const g = Math.floor(180 + Math.random() * 75);
        const b = 255;
        const baseAlpha = Math.random() * 0.6 + 0.2;
        
        let color = `rgba(${r}, ${g}, ${b}, ALPHA)`;
        if (Math.random() < 0.15) {
          color = `rgba(180, 160, 255, ALPHA)`;
        } else if (Math.random() < 0.05) {
          color = `rgba(255, 255, 255, ALPHA)`;
        }

        particles.push(new Particle(x, y, color, baseAlpha));
      }
    };

    const animate = () => {
      ctx.fillStyle = 'rgba(5, 5, 5, 0.3)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.globalCompositeOperation = 'screen';
      
      particles.forEach(p => {
        p.update(mouseX, mouseY);
        p.draw(ctx);
      });
      
      ctx.globalCompositeOperation = 'source-over';
      
      animationFrameId = requestAnimationFrame(animate);
    };

    window.addEventListener('resize', resize);
    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    });
    canvas.addEventListener('mouseleave', () => {
      mouseX = -1000;
      mouseY = -1000;
    });
    
    canvas.addEventListener('touchmove', (e) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.touches[0].clientX - rect.left;
      mouseY = e.touches[0].clientY - rect.top;
    });
    canvas.addEventListener('touchend', () => {
      mouseX = -1000;
      mouseY = -1000;
    });

    resize();
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="w-full h-full absolute inset-0 z-0 cursor-crosshair"
    />
  );
}
