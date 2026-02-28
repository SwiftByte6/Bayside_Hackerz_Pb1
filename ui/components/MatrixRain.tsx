'use client';

import { useEffect, useRef } from 'react';

interface Particle {
    x: number;
    y: number;
    vy: number;
    char: string;
    color: string;
    alpha: number;
    decay: number;
}

export default function MatrixRain() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mouseRef = useRef<{ x: number; y: number } | null>(null);
    const particlesRef = useRef<Particle[]>([]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const fontSize = 14;
        const chars =
            'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEF<>{}[]|∆Ω'.split('');
        const neonColors = ['#00ffff', '#ff00ff', '#ff6600', '#0080ff', '#ff0055', '#39ff14', '#c800ff', '#ffffff'];

        const init = () => {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
        };
        init();
        window.addEventListener('resize', init);

        // Track mouse on parent (canvas has pointerEvents:none)
        const parent = canvas.parentElement;
        const onMove = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
        };
        const onLeave = () => { mouseRef.current = null; };
        if (parent) {
            parent.addEventListener('mousemove', onMove);
            parent.addEventListener('mouseleave', onLeave);
        }

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const mouse = mouseRef.current;

            // Spawn new particles at cursor position
            if (mouse) {
                const spawnCount = 4;
                for (let i = 0; i < spawnCount; i++) {
                    const spreadX = (Math.random() - 0.5) * 80; // ±40px horizontal spread
                    particlesRef.current.push({
                        x: mouse.x + spreadX,
                        y: mouse.y + (Math.random() * 20 - 10),
                        vy: 1 + Math.random() * 2,          // fall speed
                        char: chars[Math.floor(Math.random() * chars.length)],
                        color: neonColors[Math.floor(Math.random() * neonColors.length)],
                        alpha: 0.8 + Math.random() * 0.2,
                        decay: 0.02 + Math.random() * 0.025, // fade speed
                    });
                }
            }

            // Update & draw particles
            ctx.font = `${fontSize}px 'Courier New', monospace`;
            particlesRef.current = particlesRef.current.filter(p => p.alpha > 0);

            for (const p of particlesRef.current) {
                ctx.globalAlpha = p.alpha;
                ctx.shadowColor = p.color;
                ctx.shadowBlur = 10;
                ctx.fillStyle = p.color;
                ctx.fillText(p.char, p.x, p.y);

                // Advance
                p.y += p.vy;
                p.alpha -= p.decay;
            }

            ctx.globalAlpha = 1;
            ctx.shadowBlur = 0;
        };

        const interval = setInterval(draw, 40);

        return () => {
            clearInterval(interval);
            window.removeEventListener('resize', init);
            if (parent) {
                parent.removeEventListener('mousemove', onMove);
                parent.removeEventListener('mouseleave', onLeave);
            }
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 0,
            }}
        />
    );
}
