'use client';

import { useEffect, useRef } from 'react';

export default function CustomCursor() {
    const dotRef = useRef<HTMLDivElement>(null);
    const ringRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const dot = dotRef.current;
        const ring = ringRef.current;
        if (!dot || !ring) return;

        let mouseX = -100, mouseY = -100;
        let ringX = -100, ringY = -100;
        let hovering = false;
        let raf: number;

        const onMove = (e: MouseEvent) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        };

        const onEnter = () => { hovering = true; };
        const onLeave = () => { hovering = false; };

        const interactives = () => document.querySelectorAll('button, a, input, [role="button"], .interactive-hover');

        const attachHover = () => {
            interactives().forEach(el => {
                el.addEventListener('mouseenter', onEnter);
                el.addEventListener('mouseleave', onLeave);
            });
        };

        // Re-attach on DOM changes
        const observer = new MutationObserver(attachHover);
        observer.observe(document.body, { childList: true, subtree: true });
        attachHover();

        const animate = () => {
            // Dot snaps instantly
            dot.style.transform = `translate(${mouseX - 4}px, ${mouseY - 4}px)`;

            // Ring lags behind
            ringX += (mouseX - ringX) * 0.12;
            ringY += (mouseY - ringY) * 0.12;

            const scale = hovering ? 2.2 : 1;
            ring.style.transform = `translate(${ringX - 20}px, ${ringY - 20}px) scale(${scale})`;
            ring.style.opacity = hovering ? '0.5' : '1';

            raf = requestAnimationFrame(animate);
        };

        window.addEventListener('mousemove', onMove);
        raf = requestAnimationFrame(animate);

        // Hide native cursor
        document.body.style.cursor = 'none';

        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener('mousemove', onMove);
            observer.disconnect();
            document.body.style.cursor = '';
        };
    }, []);

    return (
        <>
            {/* Dot */}
            <div ref={dotRef} style={{
                position: 'fixed', top: 0, left: 0, zIndex: 99999,
                width: 8, height: 8, borderRadius: '50%',
                background: '#a78bfa',
                pointerEvents: 'none',
                boxShadow: '0 0 10px #a78bfa, 0 0 20px #7c3aed',
                transition: 'box-shadow 0.2s',
            }} />
            {/* Ring */}
            <div ref={ringRef} style={{
                position: 'fixed', top: 0, left: 0, zIndex: 99998,
                width: 40, height: 40, borderRadius: '50%',
                border: '1.5px solid rgba(167,139,250,0.6)',
                pointerEvents: 'none',
                transition: 'opacity 0.3s, transform 0.05s linear',
            }} />
        </>
    );
}
