import { Metadata } from 'next';
import Link from 'next/link';
import { FileText } from 'lucide-react';
import { getSiteConfig, getEnhancedSiteConfig } from '@/lib/config';
import { getCategories, getPosts } from '@/lib/wordpress';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import PostGrid from '@/components/ui/PostGrid';
import styles from './category.module.css';

interface PageProps {
    params: Promise<{ slug: string }>;
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const config = getSiteConfig();

    if (!config.wordpressUrl) {
        return { title: 'Category' };
    }

    const categories = await getCategories(config.wordpressUrl);
    const category = categories.find(c => c.slug === slug);

    if (category) {
        return {
            title: `${category.name} | ${config.siteName}`,
            description: category.description || `Browse posts in ${category.name}`,
        };
    }

    return { title: 'Category Not Found' };
}

export default async function CategoryPage({ params }: PageProps) {
    const { slug } = await params;
    const config = await getEnhancedSiteConfig();

    if (!config.wordpressUrl) {
        return (
            <div className={styles.categoryPage}>
                <Header config={config} />
                <main className={styles.pageContent}>
                    <div className={styles.notFound}>
                        <h1 className={styles.notFoundTitle}>Not Configured</h1>
                        <p className={styles.notFoundDesc}>Please complete the installation first.</p>
                        <Link href="/install" className="btn btn-primary">Start Installation</Link>
                    </div>
                </main>
                <Footer config={config} />
            </div>
        );
    }

    // Get categories and find current one
    const categories = await getCategories(config.wordpressUrl);
    const category = categories.find(c => c.slug === slug);

    if (!category) {
        return (
            <div className={styles.categoryPage}>
                <Header config={config} />
                <main className={styles.pageContent}>
                    <div className={styles.notFound}>
                        <h1 className={styles.notFoundTitle}>Category Not Found</h1>
                        <p className={styles.notFoundDesc}>This category doesn&apos;t exist.</p>
                        <Link href="/" className="btn btn-primary">Back to Home</Link>
                    </div>
                </main>
                <Footer config={config} />
            </div>
        );
    }

    // Fetch posts for this category
    const { posts } = await getPosts(config.wordpressUrl, {
        first: 12,
        categoryId: category.databaseId,
    });

    return (
        <div className={styles.categoryPage}>
            <Header config={config} />

            <main className={styles.pageContent}>
                <header className={styles.categoryHeader}>
                    <span className={styles.categoryBadge}>Category</span>
                    <h1 className={styles.categoryTitle}>{category.name}</h1>
                    {category.description && (
                        <div
                            className={styles.categoryDescription}
                            dangerouslySetInnerHTML={{ __html: category.description }}
                        />
                    )}
                    <div className={styles.categoryMeta}>
                        <span className={styles.postCount}>
                            <FileText size={16} />
                            {category.count || 0} posts
                        </span>
                    </div>
                </header>

                {posts.length > 0 ? (
                    <PostGrid posts={posts} layout="grid" />
                ) : (
                    <div className={styles.notFound}>
                        <h2 className={styles.notFoundTitle}>No posts yet</h2>
                        <p className={styles.notFoundDesc}>
                            There are no posts in this category yet.
                        </p>
                    </div>
                )}
            </main>

            <Footer config={config} />
        </div>
    );
}
