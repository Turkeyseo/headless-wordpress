import Link from 'next/link';
import { FileText } from 'lucide-react';
import { SiteConfig } from '@/lib/config-types';
import { WPCategory, WPPost, WPTag } from '@/lib/wordpress';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import PostGrid from '@/components/ui/PostGrid';
import styles from '@/app/category/[slug]/category.module.css'; // Importing via absolute path alias might be safer if supported, or relative. Or move CSS.

interface CategoryTemplateProps {
    category: WPCategory | WPTag; // Accept WPTag as well (they share similar structure)
    posts: WPPost[];
    config: SiteConfig;
    type?: 'Category' | 'Tag';
}

export default function CategoryTemplate({ category, posts, config, type = 'Category' }: CategoryTemplateProps) {
    return (
        <div className={styles.categoryPage}>
            <Header config={config} />

            <main className={styles.pageContent}>
                <header className={styles.categoryHeader}>
                    <span className={styles.categoryBadge}>{type}</span>
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

// Helper for "Not Found" state if category is missing but logic passed here (rare)
export function CategoryNotFound({ config }: { config: SiteConfig }) {
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
