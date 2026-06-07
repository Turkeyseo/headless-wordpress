'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, Menu, X, Loader2, Circle, Twitter, Facebook, Instagram, Youtube, Linkedin, ChevronDown } from 'lucide-react';
import { SiteConfig, MenuItem } from '@/lib/config';
import { debounce, stripHtml, truncate } from '@/lib/utils';
import styles from './Header.module.css';

import AdUnit from '@/components/AdUnit';

interface HeaderProps {
    config: SiteConfig;
}

interface SearchResult {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    category: string | null;
}

export default function Header({ config }: HeaderProps) {
    const [showSearch, setShowSearch] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    // Search via API
    const performSearch = useCallback(async (query: string) => {
        if (!query.trim()) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=5`);
            if (response.ok) {
                const data = await response.json();
                setSearchResults(data.results || []);
            }
        } catch {
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    }, []);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const debouncedSearch = useCallback(
        debounce((query: string) => performSearch(query), 300),
        [performSearch]
    );

    useEffect(() => {
        debouncedSearch(searchQuery);
    }, [searchQuery, debouncedSearch]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setShowSearch(true);
            }
            if (e.key === 'Escape') {
                setShowSearch(false);
                setShowMobileMenu(false);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <>
            {/* Header Top Ad */}
            <AdUnit
                slotId="header_top"
                config={config.ads?.find(a => a.id === 'header_top')}
                className="max-w-7xl mx-auto px-4"
            />

            {/* Top Status Bar */}
            {config.topBar?.enabled !== false && (
                <div className={styles.topBar}>
                    <div className={styles.topBarInner}>
                        <div className={styles.topBarLeft}>
                            <span className={styles.topBarText}>
                                {config.topBar?.statusText || '✨ New features available! Explore now.'}
                            </span>
                        </div>
                        <div className={styles.socialLinks}>
                            {(config.socialLinks || []).map((social, index) => {
                                const Icon = {
                                    twitter: Twitter,
                                    facebook: Facebook,
                                    instagram: Instagram,
                                    youtube: Youtube,
                                    linkedin: Linkedin,
                                    tiktok: Circle,
                                }[social.platform] || Circle;
                                return (
                                    <a
                                        key={index}
                                        href={social.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={styles.socialLink}
                                        aria-label={social.platform}
                                    >
                                        <Icon size={14} />
                                    </a>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Main Header */}
            <header className={styles.header}>
                <div className={styles.headerInner}>
                    <Link href="/" className={styles.logo}>
                        {config.logoUrl ? (
                            <Image
                                src={config.logoUrl}
                                alt={config.siteName}
                                width={120}
                                height={36}
                                className={styles.logoImage}
                            />
                        ) : (
                            <span className={styles.logoText}>{config.siteName || 'Headless WP'}</span>
                        )}
                    </Link>

                    <nav className={styles.nav}>
                        <ul className={styles.navList}>
                            {config.menus.primary.map((item: MenuItem, index: number) => (
                                <li key={item.id || index} className={item.children && item.children.length > 0 ? styles.menuItemWithDropdown : ''}>
                                    <Link href={item.url} className={styles.navLink}>
                                        {item.label}
                                        {item.children && item.children.length > 0 && (
                                            <ChevronDown size={14} className={styles.dropdownIcon} />
                                        )}
                                    </Link>
                                    {item.children && item.children.length > 0 && (
                                        <ul className={styles.dropdownMenu}>
                                            {item.children.map((child, cIndex) => (
                                                <li key={child.id || cIndex}>
                                                    <Link href={child.url} className={styles.dropdownLink}>
                                                        {child.label}
                                                    </Link>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </nav>

                    <div className={styles.headerActions}>
                        {config.headerCta && (
                            <Link
                                href={config.headerCta.url}
                                className={styles.ctaButton}
                            >
                                {config.headerCta.text}
                            </Link>
                        )}
                        <button
                            className={styles.searchButton}
                            onClick={() => setShowSearch(true)}
                            aria-label="Search (Ctrl+K)"
                            title="Search (Ctrl+K)"
                        >
                            <Search size={18} />
                        </button>



                        <button
                            className={styles.mobileMenuButton}
                            aria-label="Menu"
                            onClick={() => setShowMobileMenu(!showMobileMenu)}
                        >
                            {showMobileMenu ? <X size={20} /> : <Menu size={20} />}
                        </button>
                    </div>
                </div>
            </header>

            {/* Mobile Menu */}
            {showMobileMenu && (
                <div className={styles.mobileMenu}>
                    <nav>
                        <ul className={styles.mobileNavList}>
                            {config.menus.primary.map((item: MenuItem, index: number) => (
                                <li key={item.id || index}>
                                    <Link
                                        href={item.url}
                                        className={styles.mobileNavLink}
                                        onClick={() => setShowMobileMenu(false)}
                                    >
                                        {item.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </nav>
                </div>
            )}

            {/* Search Modal */}
            {showSearch && (
                <div className={styles.searchModal} onClick={() => setShowSearch(false)}>
                    <div className={styles.searchBox} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.searchInputWrapper}>
                            <Search size={20} className={styles.searchIcon} />
                            <input
                                type="text"
                                className={styles.searchInput}
                                placeholder="Search posts..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                autoFocus
                            />
                            {isSearching && <Loader2 size={20} className={styles.searchSpinner} />}
                            <kbd className={styles.searchKbd}>ESC</kbd>
                        </div>

                        {searchQuery && (
                            <div className={styles.searchResults}>
                                {searchResults.length > 0 ? (
                                    searchResults.map((post) => (
                                        <Link
                                            key={post.id}
                                            href={`/${post.slug}`}
                                            className={styles.searchResultItem}
                                            onClick={() => {
                                                setShowSearch(false);
                                                setSearchQuery('');
                                            }}
                                        >
                                            <div className={styles.searchResultTitle}>{post.title}</div>
                                            {post.category && (
                                                <span className={styles.searchResultCategory}>{post.category}</span>
                                            )}
                                            <div className={styles.searchResultExcerpt}>
                                                {truncate(stripHtml(post.excerpt), 100)}
                                            </div>
                                        </Link>
                                    ))
                                ) : !isSearching ? (
                                    <div className={styles.searchNoResults}>
                                        No results found for &quot;{searchQuery}&quot;
                                    </div>
                                ) : null}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
