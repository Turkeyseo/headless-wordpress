// Progress Bar Component for page transitions
'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import styles from './ProgressBar.module.css';

export default function ProgressBar() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        // Flash a quick completion bar whenever the route changes. State is
        // only updated from async callbacks (rAF/timeout), never synchronously
        // in the effect body — see react-hooks/set-state-in-effect.
        const frame = requestAnimationFrame(() => setProgress(100));
        const timeout = setTimeout(() => setProgress(0), 300);
        return () => {
            cancelAnimationFrame(frame);
            clearTimeout(timeout);
        };
    }, [pathname, searchParams]);

    if (progress === 0) return null;

    return (
        <div
            className={styles.progressBar}
            style={{ width: `${progress}%` }}
        />
    );
}
