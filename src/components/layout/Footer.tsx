import Link from 'next/link';
import { SiteConfig } from '@/lib/config';
import styles from './Footer.module.css';
import AdUnit from '@/components/AdUnit';
import { getPosts, getCategories, WPPost, WPCategory } from '@/lib/wordpress';
import { formatDate } from '@/lib/utils';

interface FooterProps {
    config: SiteConfig;
}

// Whspe Icon
const WhspeIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM5.9 16.8L8.1 8H10.1L11.5 14.5L12.9 8H14.9L17.1 16.8H14.9L14.1 12.5L13 16.8H10L8.9 12.5L8.1 16.8H5.9Z" fill="currentColor" />
    </svg>
);

// Next.js Logo SVG
const NextJsIcon = () => (
    <svg
        className={styles.nextIcon}
        viewBox="0 0 180 180"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <mask
            id="mask0_408_134"
            style={{ maskType: 'alpha' }}
            maskUnits="userSpaceOnUse"
            x="0"
            y="0"
            width="180"
            height="180"
        >
            <circle cx="90" cy="90" r="90" fill="black" />
        </mask>
        <g mask="url(#mask0_408_134)">
            <circle cx="90" cy="90" r="90" fill="currentColor" />
            <path
                d="M149.508 157.52L69.142 54H54V125.97H66.1136V69.3836L139.999 164.845C143.333 162.614 146.509 160.165 149.508 157.52Z"
                fill="url(#paint0_linear_408_134)"
            />
            <rect
                x="115"
                y="54"
                width="12"
                height="72"
                fill="url(#paint1_linear_408_134)"
            />
        </g>
        <defs>
            <linearGradient
                id="paint0_linear_408_134"
                x1="109"
                y1="116.5"
                x2="144.5"
                y2="160.5"
                gradientUnits="userSpaceOnUse"
            >
                <stop stopColor="var(--background)" />
                <stop offset="1" stopColor="var(--background)" stopOpacity="0" />
            </linearGradient>
            <linearGradient
                id="paint1_linear_408_134"
                x1="121"
                y1="54"
                x2="120.799"
                y2="106.875"
                gradientUnits="userSpaceOnUse"
            >
                <stop stopColor="var(--background)" />
                <stop offset="1" stopColor="var(--background)" stopOpacity="0" />
            </linearGradient>
        </defs>
    </svg>
);



export default async function Footer({ config }: FooterProps) {
    const currentYear = new Date().getFullYear();

    // Fetch dynamic content
    let latestPosts: WPPost[] = [];
    let topCategories: WPCategory[] = [];

    if (config.wordpressUrl) {
        try {
            const [postsData, categoriesData] = await Promise.all([
                getPosts(config.wordpressUrl, { first: 5 }),
                getCategories(config.wordpressUrl)
            ]);

            latestPosts = postsData.posts;
            topCategories = [...categoriesData]
                .sort((a, b) => (b.count || 0) - (a.count || 0))
                .slice(0, 5);
        } catch (error) {
            console.error('Failed to fetch footer data:', error);
        }
    }

    return (
        <footer className={styles.footer}>
            <AdUnit
                slotId="footer_top"
                config={config.ads?.find(a => a.id === 'footer_top')}
                className="max-w-7xl mx-auto px-4"
            />
            <div className={styles.footerContent}>
                <div className={styles.footerTop}>
                    {/* Column 1: Brand & Description */}
                    <div className={styles.footerBrand}>
                        <div className={styles.footerLogo}>{config.siteName}</div>
                        <p className={styles.footerDescription}>
                            {config.footerText || "Powered by WordPress and Next.js. The modern way to build fast, SEO-friendly websites with headless architecture."}
                        </p>
                    </div>

                    {/* Column 2: Latest Posts */}
                    <div className={styles.footerNavColumn}>
                        <h4>Latest Posts</h4>
                        <ul className={styles.footerRecentPosts}>
                            {latestPosts.length > 0 ? (
                                latestPosts.map(post => (
                                    <li key={post.id}>
                                        <Link href={`/${post.slug}`} className={styles.footerPostLink}>
                                            {post.title}
                                        </Link>
                                        <span className={styles.footerPostDate}>{formatDate(post.date)}</span>
                                    </li>
                                ))
                            ) : (
                                <li style={{ color: '#a1a1aa', fontSize: '0.9rem' }}>No posts found.</li>
                            )}
                        </ul>
                    </div>

                    {/* Column 3: Top Categories */}
                    <div className={styles.footerNavColumn}>
                        <h4>Top Categories</h4>
                        <ul className={styles.footerNavList}>
                            {topCategories.length > 0 ? (
                                topCategories.map((cat: WPCategory) => (
                                    <li key={cat.id}>
                                        <Link href={`/category/${cat.slug}`} className={styles.footerNavLink}>
                                            {cat.name} {cat.count ? `(${cat.count})` : ''}
                                        </Link>
                                    </li>
                                ))
                            ) : (
                                <li style={{ color: '#a1a1aa', fontSize: '0.9rem' }}>No categories found.</li>
                            )}
                        </ul>
                    </div>
                </div>

                <div className={styles.footerBottom}>
                    <p className={styles.copyright}>
                        &copy; {currentYear} {config.siteName}. All rights reserved.
                    </p>
                    <div className={styles.footerLinks}>
                        <a href="http://www.whspe.com" target="_blank" rel="noopener noreferrer" className={styles.iconLink} aria-label="Whspe">
                            <WhspeIcon />
                        </a>
                        <a href="https://nextjs.org" target="_blank" rel="noopener noreferrer" className={styles.iconLink} aria-label="Next.js">
                            <NextJsIcon />
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
