'use client';

import { useState, useEffect, useCallback, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { X } from 'lucide-react';

// Stable no-op subscription: the snapshot never changes after hydration, so we
// only need it to read true on the client and false on the server.
const emptySubscribe = () => () => {};

interface ImageWithLightboxProps {
    src: string;
    alt: string;
    width: number;
    height: number;
    className?: string;
    style?: React.CSSProperties;
    sizes?: string;
}

/**
 * ImageWithLightbox - Next.js Image component with lightbox functionality
 * Displays an image that opens in a fullscreen lightbox when clicked
 */
export default function ImageWithLightbox({
    src,
    alt,
    width,
    height,
    className,
    style,
    sizes
}: ImageWithLightboxProps) {
    const [isOpen, setIsOpen] = useState(false);
    // Client-only flag (replaces the mounted-state-in-effect pattern). Renders
    // false during SSR/first paint, then true on the client — safe for the
    // createPortal(document.body) call below.
    const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

    // Handle body scroll lock when lightbox is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    // Handle escape key to close lightbox
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            setIsOpen(false);
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            return () => document.removeEventListener('keydown', handleKeyDown);
        }
    }, [isOpen, handleKeyDown]);

    // Server-side render fallback
    if (!mounted) {
        return (
            <div
                className={`relative overflow-hidden rounded-lg ${className || ''}`}
                style={{ ...style, width: '100%', height: 'auto' }}
            >
                <Image
                    src={src}
                    alt={alt}
                    width={width}
                    height={height}
                    className="w-full h-auto"
                    sizes={sizes}
                />
            </div>
        );
    }

    const lightbox = isOpen ? (
        <div
            className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/95 p-4 backdrop-blur-md"
            onClick={() => setIsOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-label={`Enlarged view of ${alt}`}
        >
            <button
                className="absolute top-4 right-4 text-white/80 hover:text-white p-2 transition-colors z-[100000] hover:bg-white/10 rounded-full"
                onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(false);
                }}
                aria-label="Close lightbox"
            >
                <X size={32} />
            </button>
            <div
                className="relative w-full h-full max-w-7xl max-h-[90vh] flex items-center justify-center"
                onClick={(e) => e.stopPropagation()}
            >
                <Image
                    src={src}
                    alt={alt}
                    fill
                    className="object-contain"
                    priority
                    sizes="100vw"
                    quality={90}
                />
            </div>
        </div>
    ) : null;

    return (
        <>
            <div
                className={`relative cursor-pointer overflow-hidden rounded-lg group ${className || ''}`}
                onClick={() => setIsOpen(true)}
                style={{ ...style, width: '100%', height: 'auto' }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setIsOpen(true);
                    }
                }}
                aria-label={`View ${alt} in fullscreen`}
            >
                <Image
                    src={src}
                    alt={alt}
                    width={width}
                    height={height}
                    className="transition-transform duration-500 group-hover:scale-105 w-full h-auto"
                    style={{ width: '100%', height: 'auto' }}
                    sizes={sizes}
                />
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
            </div>
            {createPortal(lightbox, document.body)}
        </>
    );
}
