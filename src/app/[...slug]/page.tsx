import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import TableOfContents from '@/components/ui/TableOfContents';
import { gutenbergOptions } from '@/lib/gutenberg';
import { Clock, FileQuestion, MapPin } from 'lucide-react';
import parse from 'html-react-parser';
import { getSiteConfig, getEnhancedSiteConfig } from '@/lib/config';
import { getPostBySlug, getPageBySlug, getRelatedPosts, getCategories, getPosts, getTags, getComments, getPostAcfData, WPPost, WPCategory } from '@/lib/wordpress';
import { processContentForGalleries } from '@/lib/content-processor';
import { formatDate, extractTableOfContents, addHeadingIds, calculateReadingTime, stripHtml } from '@/lib/utils';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import PostCard from '@/components/ui/PostCard';
import Comments from '@/components/ui/Comments';
import AcfRenderer from '@/components/ui/AcfRenderer';
import CategoryTemplate, { CategoryNotFound } from '@/components/templates/CategoryTemplate';
import AdUnit from '@/components/AdUnit';
import styles from './slug.module.css';
import { getLocalPages } from '@/lib/actions';

interface PageProps {
    params: Promise<{ slug: string }>;
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const resolvedParams = await params;
    const slugSegments = Array.isArray(resolvedParams.slug) ? resolvedParams.slug : [resolvedParams.slug];
    const slug = slugSegments[slugSegments.length - 1];
    const config = getSiteConfig();

    if (!config.wordpressUrl) {
        return { title: 'Not Found' };
    }

    // Try to find post first
    const post = await getPostBySlug(config.wordpressUrl, slug);

    if (post) {
        return {
            title: post.seo?.title || `${post.title} - ${config.siteName}`,
            description: post.seo?.metaDesc || stripHtml(post.excerpt).slice(0, 160),
            openGraph: {
                title: post.seo?.opengraphTitle || post.title,
                description: post.seo?.opengraphDescription || stripHtml(post.excerpt).slice(0, 160),
                images: post.seo?.opengraphImage?.sourceUrl || post.featuredImage?.node?.sourceUrl
                    ? [{ url: post.seo?.opengraphImage?.sourceUrl || post.featuredImage!.node.sourceUrl }]
                    : undefined,
            },
        };
    }

    // Try page
    const page = await getPageBySlug(config.wordpressUrl, slug);

    if (page) {
        return {
            title: page.seo?.title || `${page.title} - ${config.siteName}`,
            description: page.seo?.metaDesc || stripHtml(page.content).slice(0, 160),
        };
    }

    return {
        title: 'Not Found',
    };
}

export default async function SlugPage({ params }: PageProps) {
    const resolvedParams = await params;
    // Handle array slug (catch-all) or string slug
    const slugSegments = Array.isArray(resolvedParams.slug) ? resolvedParams.slug : [resolvedParams.slug];
    const slug = slugSegments[slugSegments.length - 1]; // Use actual slug (last part)

    // Check if we need to redirect (e.g. if URL structure logic is enforced here later)
    // For now trust the slug.

    const config = await getEnhancedSiteConfig();

    if (!config.wordpressUrl) {
        return (
            <div className={styles.postPage}>
                <Header config={config} />
                <main className={styles.article}>
                    <div className={styles.notFound}>
                        <div className={styles.notFoundIcon}>
                            <FileQuestion size={40} />
                        </div>
                        <h1 className={styles.notFoundTitle}>Not Configured</h1>
                        <p className={styles.notFoundDesc}>
                            Please complete the installation first.
                        </p>
                        <Link href="/install" className="btn btn-primary">
                            Start Installation
                        </Link>
                    </div>
                </main>
                <Footer config={config} />
            </div>
        );
    }

    // CHECK FOR CUSTOM CATEGORY BASE
    if (config.seo?.categoryBase && slugSegments.length === 2 && slugSegments[0] === config.seo.categoryBase) {
        const categorySlug = slugSegments[1];
        const categories = await getCategories(config.wordpressUrl);
        const category = categories.find(c => c.slug === categorySlug);

        if (category) {
            const { posts } = await getPosts(config.wordpressUrl, {
                first: 12,
                categoryId: category.databaseId,
            });
            return <CategoryTemplate category={category} posts={posts} config={config} />;
        } else {
            return <CategoryNotFound config={config} />;
        }
    }

    // CHECK FOR CUSTOM TAG BASE
    if (config.seo?.tagBase && slugSegments.length === 2 && slugSegments[0] === config.seo.tagBase) {
        const tagSlug = slugSegments[1];
        const tags = await getTags(config.wordpressUrl);
        const tag = tags.find(t => t.slug === tagSlug);

        if (tag) {
            const { posts } = await getPosts(config.wordpressUrl, {
                first: 12,
                tagSlugIn: [tagSlug],
            });
            return <CategoryTemplate category={tag} posts={posts} config={config} type="Tag" />;
        } else {
            return <CategoryNotFound config={config} />;
        }
    }

    // Try to find post first
    // CHECK FOR LOCAL PAGES FIRST
    const localPages = await getLocalPages();
    const localPage = localPages.find((p: { slug: string }) => p.slug === slug);

    if (localPage) {
        return (
            <div className={styles.postPage}>
                <Header config={config} />
                <main className={styles.article} style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
                    <header className={styles.postHeader} style={{ textAlign: 'center', marginBottom: '3rem' }}>
                        <h1 className={styles.postTitle} style={{ fontSize: '3rem', fontWeight: 800 }}>{localPage.title}</h1>
                    </header>
                    <div className={`${styles.postContent} prose max-w-none`}>
                        {parse(localPage.content, gutenbergOptions)}
                    </div>
                </main>
                <Footer config={config} />
            </div>
        );
    }

    const post = await getPostBySlug(config.wordpressUrl, slug);
    let page = null;

    if (!post) {
        // Try to find page
        page = await getPageBySlug(config.wordpressUrl, slug);
    }

    // If neither found, show 404
    if (!post && !page) {
        return (
            <div className={styles.postPage}>
                <Header config={config} />
                <main className={styles.article}>
                    <div className={styles.notFound}>
                        <div className={styles.notFoundIcon}>
                            <FileQuestion size={40} />
                        </div>
                        <h1 className={styles.notFoundTitle}>Page Not Found</h1>
                        <p className={styles.notFoundDesc}>
                            The page you&apos;re looking for doesn&apos;t exist or has been moved.
                        </p>
                        <Link href="/" className="btn btn-primary">
                            Back to Home
                        </Link>
                    </div>
                </main>
                <Footer config={config} />
            </div>
        );
    }

    // Render post or page
    const content = post || page!;
    const isPost = !!post;
    const readingTime = calculateReadingTime(content.content);
    const toc = extractTableOfContents(content.content);
    const contentWithIds = addHeadingIds(content.content);

    // Split content for TOC placement
    const firstH2Index = contentWithIds.indexOf('<h2');
    let contentBeforeTOC = contentWithIds;
    let contentAfterTOC = '';

    if (firstH2Index !== -1 && toc.length > 2) {
        contentBeforeTOC = contentWithIds.substring(0, firstH2Index);
        contentAfterTOC = contentWithIds.substring(firstH2Index);
    } else if (toc.length > 2) {
        contentBeforeTOC = '';
        contentAfterTOC = contentWithIds;
    }

    // Parallel fetch secondary data
    const [relatedPosts, comments, acfData] = await Promise.all([
        isPost && post?.categories?.nodes
            ? getRelatedPosts(
                config.wordpressUrl,
                post.id,
                post.categories.nodes.map((c: WPCategory) => c.databaseId),
                config.postSettings?.relatedPosts?.count || 3
            )
            : Promise.resolve([]),
        (isPost && config.plugins?.comments?.enabled)
            ? getComments(config.wordpressUrl, post!.databaseId)
            : Promise.resolve([]),
        (isPost && config.plugins?.acf?.enabled)
            ? getPostAcfData(config.wordpressUrl, post!.databaseId)
            : Promise.resolve(null),
    ]);

    // Share functionality can be added in the future

    const heroImage = content.featuredImage?.node?.sourceUrl;

    return (
        <div className={styles.postPage}>
            <Header config={config} />

            {/* Hero Section */}
            {heroImage && (
                <div className={styles.heroSection}>
                    <div className={styles.heroImageWrapper}>
                        <Image
                            src={heroImage}
                            alt={content.featuredImage?.node?.altText || content.title}
                            fill
                            priority
                            quality={90}
                            sizes="(max-width: 768px) 100vw, 100vw"
                            className={styles.imgAnimation}
                            style={{ objectFit: 'cover' }}
                        />
                        <div className={styles.heroOverlay} />
                    </div>
                    <div className={styles.heroContent}>
                        <div className={styles.heroMeta}>
                            {isPost && post?.categories?.nodes?.[0] && (
                                <span className={styles.category}>
                                    <MapPin size={10} style={{ strokeWidth: 3 }} />
                                    {post.categories.nodes[0].name}
                                </span>
                            )}
                            {isPost && (
                                <span className={styles.readTime}>
                                    {readingTime} dk okuma
                                </span>
                            )}
                        </div>
                        <h1 className={styles.heroTitle}>{content.title}</h1>
                        {isPost && post?.author?.node && (
                            <div className={styles.author} style={{ marginTop: '0.5rem' }}>
                                {post.author.node.avatar?.url && (
                                    <Image
                                        src={post.author.node.avatar.url}
                                        alt={post.author.node.name}
                                        width={40}
                                        height={40}
                                        className={styles.authorAvatar}
                                    />
                                )}
                                <div className={styles.authorInfo} style={{ textAlign: 'left' }}>
                                    <div className={styles.authorName}>{post.author.node.name}</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <article className={styles.article}>
                {/* Fallback Post Header */}
                {!heroImage && (
                    <header className={styles.postHeader}>
                        <div className={styles.postMeta}>
                            {isPost && post?.categories?.nodes?.[0] && (
                                <span className={styles.category}>{post.categories.nodes[0].name}</span>
                            )}
                            {isPost && (
                                <>
                                    <span className={styles.date}>{formatDate(post!.date)}</span>
                                    <span className={styles.readTime}>
                                        <Clock size={14} />
                                        {readingTime} min read
                                    </span>
                                </>
                            )}
                        </div>

                        <h1 className={styles.postTitle}>{content.title}</h1>

                        {isPost && post?.excerpt && (
                            <p className={styles.postExcerpt}>{stripHtml(post.excerpt)}</p>
                        )}

                        {isPost && post?.author?.node && (
                            <div className={styles.author}>
                                {post.author.node.avatar?.url && (
                                    <Image
                                        src={post.author.node.avatar.url}
                                        alt={post.author.node.name}
                                        width={48}
                                        height={48}
                                        className={styles.authorAvatar}
                                    />
                                )}
                                <div className={styles.authorInfo}>
                                    <div className={styles.authorName}>{post.author.node.name}</div>
                                    <div className={styles.authorLabel}>Author</div>
                                </div>
                            </div>
                        )}
                    </header>
                )}

                {/* Content with Injected TOC */}
                <AdUnit
                    slotId="post_top"
                    config={config.ads?.find(a => a.id === 'post_top')}
                    className="mb-8"
                />

                <div className={`${styles.postContent} prose max-w-none`}>
                    {parse(processContentForGalleries(contentBeforeTOC), gutenbergOptions)}
                    {toc.length > 2 && <TableOfContents toc={toc} />}

                    <AdUnit
                        slotId="post_content_1"
                        config={config.ads?.find(a => a.id === 'post_content_1')}
                        className="my-8"
                    />

                    {parse(processContentForGalleries(contentAfterTOC), gutenbergOptions)}
                </div>

                <AdUnit
                    slotId="post_bottom"
                    config={config.ads?.find(a => a.id === 'post_bottom')}
                    className="mt-8 mb-12"
                />

                {/* Tags */}
                {isPost && post?.tags?.nodes && post.tags.nodes.length > 0 && (
                    <div className={styles.tags}>
                        {post.tags.nodes.map((tag: { name: string; slug: string }) => (
                            <Link
                                key={tag.slug}
                                href={`/${config.seo?.tagBase || 'tag'}/${tag.slug}`}
                                className={styles.tag}
                            >
                                #{tag.name}
                            </Link>
                        ))}
                    </div>
                )}

                {/* ACF Data */}
                {isPost && acfData && config.plugins?.acf?.showInFrontend !== false && (
                    <AcfRenderer data={acfData} />
                )}

                {/* Comments */}
                {isPost && config.plugins?.comments?.enabled && (
                    <Comments postId={post!.databaseId} comments={comments} />
                )}



                {/* Related Posts */}
                {config.postSettings?.relatedPosts?.enabled !== false && relatedPosts.length > 0 && (
                    <section className={styles.relatedSection}>
                        <h2 className={styles.relatedTitle}>{config.postSettings?.relatedPosts?.title || 'Related Posts'}</h2>
                        <div className={styles.relatedGrid}>
                            {relatedPosts.map((relatedPost: WPPost) => (
                                <PostCard key={relatedPost.id} post={relatedPost} />
                            ))}
                        </div>
                    </section>
                )}
            </article>

            <Footer config={config} />
        </div>
    );
}
