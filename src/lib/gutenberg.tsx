import React from 'react';
import Link from 'next/link';
import { Element, Text, domToReact, HTMLReactParserOptions, DOMNode } from 'html-react-parser';
import ImageWithLightbox from '@/components/ui/ImageWithLightbox';
import GalleryGrid, { GalleryImage } from '@/components/ui/GalleryGrid';

/**
 * Extracts column count from gallery classes
 */
function getGalleryColumns(domNode: Element): 1 | 2 | 3 | 4 {
    const classes = domNode.attribs?.class || '';
    if (classes.includes('columns-2')) return 2;
    if (classes.includes('columns-3')) return 3;
    if (classes.includes('columns-4')) return 4;
    return 1;
}

/**
 * Recursively finds all img elements in a DOM node tree
 */
function findAllImages(node: DOMNode): Element[] {
    let images: Element[] = [];
    if (node instanceof Element) {
        if (node.name === 'img') {
            images.push(node);
        }
        node.children.forEach((child) => {
            images = images.concat(findAllImages(child as DOMNode));
        });
    }
    return images;
}

/**
 * Extracts image data from an img node
 */
function extractImageData(img: Element): GalleryImage {
    return {
        src: img.attribs.src || '',
        alt: img.attribs.alt || '',
        width: img.attribs.width ? parseInt(img.attribs.width) : 800,
        height: img.attribs.height ? parseInt(img.attribs.height) : 600
    };
}

/**
 * Checks if a DOM element is a WordPress gallery container
 */
function isGalleryContainer(domNode: Element): boolean {
    if (!domNode.attribs?.class) return false;

    const classes = domNode.attribs.class;
    return (
        classes.includes('wp-block-gallery') ||
        classes.includes('blocks-gallery-grid') ||
        classes.includes('detected-gallery') ||
        (classes.includes('gallery') && !classes.includes('gallery-icon'))
    );
}

/**
 * Checks if a paragraph only contains images (pseudo-gallery)
 */
function isPseudoGalleryParagraph(domNode: Element): boolean {
    if (domNode.name !== 'p' || !domNode.children?.length) return false;

    return domNode.children.every((child) => {
        // Allow empty text nodes
        if (child instanceof Text) return !child.data.trim();
        if (child instanceof Element) {
            // Allow br tags
            if (child.name === 'br') return true;
            // Allow img tags
            if (child.name === 'img') return true;
            // Allow anchor tags containing only images
            if (child.name === 'a') {
                return child.children?.every((grandChild) =>
                    (grandChild instanceof Element && grandChild.name === 'img') ||
                    (grandChild instanceof Text && !grandChild.data.trim())
                );
            }
        }
        return false;
    });
}

/**
 * Gutenberg Parser Options for html-react-parser
 * Handles WordPress content blocks and converts them to React components
 */
export const gutenbergOptions: HTMLReactParserOptions = {
    replace: (domNode) => {
        if (!(domNode instanceof Element)) return;

        // ===== 1. GALLERY BLOCKS =====
        // Handles: wp-block-gallery, blocks-gallery-grid, detected-gallery, classic gallery
        if (isGalleryContainer(domNode)) {
            const images = findAllImages(domNode);

            if (images.length > 0) {
                const galleryImages = images.map(extractImageData);
                const columns = getGalleryColumns(domNode);
                return <GalleryGrid images={galleryImages} columns={columns} />;
            }
        }

        // ===== 2. PSEUDO-GALLERY (Multiple images in one paragraph) =====
        // Handles: <p><img /><br /><img /></p> pattern from classic editor
        if (isPseudoGalleryParagraph(domNode)) {
            const images = findAllImages(domNode);

            if (images.length > 1) {
                const galleryImages = images.map(extractImageData);
                return <GalleryGrid images={galleryImages} />;
            }
        }

        // ===== 3. SINGLE IMAGES =====
        // Converts img tags to ImageWithLightbox component
        if (domNode.name === 'img' && domNode.attribs?.src) {
            const { src, alt, width, height, class: className } = domNode.attribs;

            const w = width ? parseInt(width) : 800;
            const h = height ? parseInt(height) : 600;

            return (
                <ImageWithLightbox
                    src={src}
                    alt={alt || ''}
                    width={w > 0 ? w : 800}
                    height={h > 0 ? h : 600}
                    className={className}
                    style={{
                        width: '100%',
                        height: 'auto',
                        maxWidth: '100%'
                    }}
                    sizes="(max-width: 768px) 100vw, 850px"
                />
            );
        }

        // ===== 4. INTERNAL LINKS =====
        // Converts internal links to Next.js Link component
        if (domNode.name === 'a') {
            const { href, class: className } = domNode.attribs;

            if (href && href.startsWith('/') && !href.startsWith('//')) {
                return (
                    <Link href={href} className={className}>
                        {domToReact(domNode.children as DOMNode[], gutenbergOptions)}
                    </Link>
                );
            }
        }

        // ===== 5. YOUTUBE EMBEDS =====
        // Wraps YouTube iframes in responsive container
        if (domNode.name === 'iframe' && domNode.attribs?.src?.includes('youtube.com')) {
            return (
                <div className="my-8">
                    <div className="relative w-full aspect-video overflow-hidden rounded-lg">
                        <iframe
                            {...domNode.attribs}
                            className="absolute top-0 left-0 w-full h-full"
                        />
                    </div>
                </div>
            );
        }

        // ===== 6. VIMEO EMBEDS =====
        if (domNode.name === 'iframe' && domNode.attribs?.src?.includes('vimeo.com')) {
            return (
                <div className="my-8">
                    <div className="relative w-full aspect-video overflow-hidden rounded-lg">
                        <iframe
                            {...domNode.attribs}
                            className="absolute top-0 left-0 w-full h-full"
                        />
                    </div>
                </div>
            );
        }

        // ===== 7. CODE BLOCKS =====
        // Adds styling to pre/code blocks
        if (domNode.name === 'pre') {
            const existingClass = domNode.attribs?.class || '';
            return (
                <pre className={`${existingClass} overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm text-gray-100`}>
                    {domToReact(domNode.children as DOMNode[], gutenbergOptions)}
                </pre>
            );
        }

        // ===== 8. BLOCKQUOTES =====
        if (domNode.name === 'blockquote') {
            const existingClass = domNode.attribs?.class || '';
            return (
                <blockquote className={`${existingClass} border-l-4 border-primary pl-4 italic my-6`}>
                    {domToReact(domNode.children as DOMNode[], gutenbergOptions)}
                </blockquote>
            );
        }

        // ===== 9. TABLES =====
        if (domNode.name === 'table') {
            const existingClass = domNode.attribs?.class || '';
            return (
                <div className="overflow-x-auto my-6">
                    <table className={`${existingClass} min-w-full border-collapse`}>
                        {domToReact(domNode.children as DOMNode[], gutenbergOptions)}
                    </table>
                </div>
            );
        }

        // Return undefined to use default rendering for other elements
        return undefined;
    }
};
