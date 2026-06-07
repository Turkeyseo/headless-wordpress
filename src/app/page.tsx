import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Globe } from 'lucide-react';
import { getEnhancedSiteConfig, HomepageSection, PostsSection, CategoryTabsSection } from '@/lib/config';
import { getPosts, getCategories, WPPost, WPCategory } from '@/lib/wordpress';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import SectionRenderer from '@/components/sections/SectionRenderer';
import PostGrid from '@/components/ui/PostGrid';
import AdUnit from '@/components/AdUnit';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const config = await getEnhancedSiteConfig();
  return {
    title: config.seo?.homepageTitle || config.siteName || 'Headless WordPress',
    description: config.seo?.homepageDescription || `Welcome to ${config.siteName}`,
  };
}

// Fetch posts for a specific section
async function getPostsForSection(
  wordpressUrl: string,
  section: PostsSection
): Promise<WPPost[]> {
  try {
    const { posts } = await getPosts(wordpressUrl, {
      first: section.postCount,
      categoryId: section.categoryId || undefined,
    });
    return posts;
  } catch {
    return [];
  }
}

// Fetch all posts needed for all sections
async function fetchAllSectionPosts(
  wordpressUrl: string,
  sections: HomepageSection[]
): Promise<Map<string, WPPost[]>> {
  const postsMap = new Map<string, WPPost[]>();

  const postsSections = sections.filter(
    (s): s is PostsSection | CategoryTabsSection =>
      s.type === 'posts-grid' ||
      s.type === 'posts-list' ||
      s.type === 'posts-magazine' ||
      s.type === 'posts-carousel' ||
      s.type === 'posts-masonry' ||
      s.type === 'posts-cards' ||
      s.type === 'posts-minimal' ||
      s.type === 'posts-overlay' ||
      s.type === 'category-tabs'
  );

  await Promise.all(
    postsSections.map(async (section) => {
      if (section.type === 'category-tabs') {
        // Fetch posts for each category in the tabs
        const allTabPosts: WPPost[] = [];
        // We fetching sequentially to avoid overwhelming server if many categories, or parallel?
        // Parallel is fine for a few categories.
        await Promise.all(section.categories.map(async (catId) => {
          try {
            const { posts } = await getPosts(wordpressUrl, {
              first: section.postCount,
              categoryId: catId
            });
            allTabPosts.push(...posts);
          } catch (e) {
            console.error(`Failed to fetch posts for category ${catId}`, e);
          }
        }));
        // Remove duplicates if any (same post in multiple categories)
        const uniquePosts = Array.from(new Map(allTabPosts.map(p => [p.id, p])).values());
        postsMap.set(section.id, uniquePosts);
      } else {
        const posts = await getPostsForSection(wordpressUrl, section);
        postsMap.set(section.id, posts);
      }
    })
  );

  return postsMap;
}

export default async function HomePage() {
  const config = await getEnhancedSiteConfig();

  // Check if not installed
  if (!config.installed || !config.wordpressUrl) {
    return (
      <div className={styles.homePage}>
        <main className={styles.notInstalledMain}>
          <div className={styles.notInstalledContent}>
            <div className={styles.globeIcon}>
              <Globe size={64} strokeWidth={1} />
            </div>
            <h1 className={styles.notInstalledTitle}>Headless WordPress</h1>
            <p className={styles.notInstalledDesc}>
              Welcome to your new Next.js + WordPress site!<br />
              Complete the installation to get started.
            </p>
            <Link href="/install" className={styles.startButton}>
              Start Installation
              <ArrowRight size={18} />
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // If sections are configured, use them
  if (config.homepageSections && config.homepageSections.length > 0) {
    // Fetch posts for all post sections
    const postsMap = await fetchAllSectionPosts(config.wordpressUrl, config.homepageSections);

    // config now already has the enhanced menu if needed

    // Fetch categories also, to pass to sections that need them (like category-tabs)
    let categories: WPCategory[] = [];
    try {
      categories = await getCategories(config.wordpressUrl);
    } catch (e) {
      console.error('Failed to fetch categories:', e);
    }

    return (
      <div className={styles.homePage}>
        <Header config={config} />
        <main className={styles.main}>
          {config.homepageSections.map((section, index) => (
            <div key={section.id}>
              <SectionRenderer
                section={section}
                posts={postsMap.get(section.id) || []}
                categories={categories}
              />
              {index === 0 && (
                <AdUnit
                  slotId="home_hero_bottom"
                  config={config.ads?.find(a => a.id === 'home_hero_bottom')}
                  className="max-w-7xl mx-auto px-4"
                />
              )}
            </div>
          ))}
        </main>
        <Footer config={config} />
      </div>
    );
  }

  // Fallback: Legacy homepage with default posts grid
  let posts: Awaited<ReturnType<typeof getPosts>>['posts'] = [];
  try {
    const result = await getPosts(config.wordpressUrl, {
      first: 10,
      categoryId: config.homeCategory || undefined,
    });
    posts = result.posts;
  } catch (error) {
    console.error('Failed to fetch posts:', error);
  }

  return (
    <div className={styles.homePage}>
      <Header config={config} />
      <main className={styles.main}>
        {/* Default Hero */}
        <section className={styles.defaultHero}>
          <div className={styles.container}>
            <h1 className={styles.heroTitle}>{config.siteName}</h1>
            <p className={styles.heroSubtitle}>Powered by WordPress and Next.js</p>
          </div>
        </section>

        <AdUnit
          slotId="home_hero_bottom"
          config={config.ads?.find(a => a.id === 'home_hero_bottom')}
          className="max-w-7xl mx-auto px-4"
        />

        {/* Posts Section */}
        <section className={styles.postsSection}>
          <div className={styles.container}>
            <h2 className={styles.sectionTitle}>Latest Posts</h2>
            <PostGrid posts={posts} layout={config.homeTemplate} />
          </div>
        </section>
      </main>
      <Footer config={config} />
    </div>
  );
}
