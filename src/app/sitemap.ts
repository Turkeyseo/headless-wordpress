import { MetadataRoute } from 'next';
import { getSiteConfig } from '@/lib/config';
import { getPosts, getCategories, getPages } from '@/lib/wordpress';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const config = getSiteConfig();
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    const sitemap: MetadataRoute.Sitemap = [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1,
        },
    ];

    if (!config.wordpressUrl) {
        return sitemap;
    }

    try {
        // Add posts (increased limit to 500)
        const { posts } = await getPosts(config.wordpressUrl, { first: 500 });
        for (const post of posts) {
            sitemap.push({
                url: `${baseUrl}/${post.slug}`,
                lastModified: new Date(post.date),
                changeFrequency: 'weekly',
                priority: 0.8,
            });
        }

        // Add WordPress pages
        const pages = await getPages(config.wordpressUrl);
        for (const page of pages) {
            // Avoid adding manager/install/index slugs if they exist in WP
            if (page.slug === 'index' || page.slug === 'home') continue;
            
            sitemap.push({
                url: `${baseUrl}/${page.slug}`,
                lastModified: new Date(page.date || Date.now()),
                changeFrequency: 'monthly',
                priority: 0.7,
            });
        }

        // Add categories
        const categories = await getCategories(config.wordpressUrl);
        for (const category of categories) {
            if (category.count === 0) continue; // Skip empty categories
            sitemap.push({
                url: `${baseUrl}/category/${category.slug}`,
                lastModified: new Date(),
                changeFrequency: 'weekly',
                priority: 0.6,
            });
        }
    } catch (error) {
        console.error('Sitemap generation error:', error);
    }

    return sitemap;
}
