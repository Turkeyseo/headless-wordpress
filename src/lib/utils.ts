// Utility functions
import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
    return clsx(inputs);
}

// Format date for display
export function formatDate(dateString: string, locale = 'en'): string {
    const date = new Date(dateString);
    return date.toLocaleDateString(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

// Strip HTML tags from content with better cleanup
export function stripHtml(html: string): string {
    if (!html) return '';
    return html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')   // Remove styles
        .replace(/<[^>]*>/g, ' ')                                           // Standard tag removal
        .replace(/\s+/g, ' ')                                               // Collapse whitespace
        .trim();
}

// Truncate text to a certain length
export function truncate(text: string, length: number): string {
    if (text.length <= length) return text;
    return text.slice(0, length).trim() + '...';
}

// Extract headings from content for TOC
export interface TocItem {
    id: string;
    text: string;
    level: number;
}

export function extractTableOfContents(content: string): TocItem[] {
    const headingRegex = /<h([2-4])[^>]*(?:id="([^"]*)")?[^>]*>([^<]+)<\/h[2-4]>/gi;
    const toc: TocItem[] = [];
    let match;

    while ((match = headingRegex.exec(content)) !== null) {
        const level = parseInt(match[1], 10);
        const id = match[2] || generateSlug(match[3]);
        const text = match[3].trim();
        toc.push({ id, text, level });
    }

    return toc;
}

// Generate slug from text
export function generateSlug(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
}

// Add IDs to headings in content for TOC linking
export function addHeadingIds(content: string): string {
    return content.replace(
        /<h([2-4])([^>]*)>([^<]+)<\/h([2-4])>/gi,
        (match, level, attrs, text, closeLevel) => {
            if (attrs.includes('id=')) return match;
            const id = generateSlug(text);
            return `<h${level}${attrs} id="${id}">${text}</h${closeLevel}>`;
        }
    );
}

// Social share URLs
export interface ShareUrls {
    twitter: string;
    facebook: string;
    linkedin: string;
    whatsapp: string;
}

export function getShareUrls(url: string, title: string): ShareUrls {
    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title);

    return {
        twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
        linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
        whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
    };
}

// Debounce function for search
export function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: ReturnType<typeof setTimeout>;
    return (...args: Parameters<T>) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

// Check if URL is external
export function isExternalUrl(url: string): boolean {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname !== window.location.hostname;
    } catch {
        return false;
    }
}

// Get WordPress media URL for next/image
export function getWPMediaUrl(url: string, width?: number): string {
    if (!url) return '';

    // If it's already a resize URL or external CDN, return as is
    if (url.includes('?w=') || url.includes('resize=')) {
        return url;
    }

    // For WordPress media, we can add resize parameters
    if (width && url.includes('/wp-content/uploads/')) {
        const separator = url.includes('?') ? '&' : '?';
        return `${url}${separator}w=${width}`;
    }

    return url;
}

// Calculate reading time
export function calculateReadingTime(content: string): number {
    const wordsPerMinute = 200;
    const text = content.replace(/<[^>]*>/g, ''); // Strip HTML
    const wordCount = text.split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
}
