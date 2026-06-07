// Config Types - can be imported anywhere (client or server)
// This file contains only type definitions, no server-side code

export interface MenuItem {
    label: string;
    url: string;
    id?: string;
    children?: MenuItem[];
}

export interface LocalPage {
    id: string;
    title: string;
    slug: string;
    content: string;
    seo?: {
        title: string;
        description: string;
    };
    status: 'published' | 'draft';
    updatedAt: string;
}

// Homepage Section Types
export type SectionType =
    | 'hero'
    | 'hero-video'
    | 'hero-slider'
    | 'posts-grid'
    | 'posts-list'
    | 'posts-magazine'
    | 'posts-carousel'
    | 'posts-masonry'
    | 'posts-cards'
    | 'posts-minimal'
    | 'posts-overlay'
    | 'category-tabs'
    | 'image-text'
    | 'image-gallery'
    | 'rich-text'
    | 'video'
    | 'html-block'
    | 'cta'
    | 'cta-split'
    | 'cta-newsletter'
    | 'features'
    | 'features-icons'
    | 'stats'
    | 'testimonials'
    | 'logos'
    | 'faq'
    | 'pricing'
    | 'team'
    | 'contact'
    | 'divider'
    | 'spacer';

export interface HeroSection {
    type: 'hero';
    id: string;
    title: string;
    subtitle: string;
    buttonText?: string;
    buttonUrl?: string;
    secondaryButtonText?: string;
    secondaryButtonUrl?: string;
    backgroundImage?: string;
    alignment: 'left' | 'center' | 'right';
    height: 'small' | 'medium' | 'large' | 'full';
    overlay: boolean;
}

export interface HeroVideoSection {
    type: 'hero-video';
    id: string;
    title: string;
    subtitle: string;
    buttonText?: string;
    buttonUrl?: string;
    videoUrl: string;
    posterImage?: string;
}

export interface HeroSliderSection {
    type: 'hero-slider';
    id: string;
    slides: {
        title: string;
        subtitle: string;
        buttonText?: string;
        buttonUrl?: string;
        backgroundImage: string;
    }[];
    autoPlay: boolean;
    interval: number;
}

export interface PostsSection {
    type: 'posts-grid' | 'posts-list' | 'posts-magazine' | 'posts-carousel' | 'posts-masonry' | 'posts-cards' | 'posts-minimal' | 'posts-overlay';
    id: string;
    title: string;
    categoryId: number;
    postCount: number;
    showViewAll: boolean;
    columns?: 2 | 3 | 4;
    showExcerpt?: boolean;
    showImage?: boolean;
    showCategory?: boolean;
    showDate?: boolean;
    showAuthor?: boolean;
}

export interface CategoryTabsSection {
    type: 'category-tabs';
    id: string;
    title: string;
    categories: number[];
    postCount: number;
    layout: 'grid' | 'list' | 'cards';
}

export interface ImageTextSection {
    type: 'image-text';
    id: string;
    title: string;
    content: string;
    imageUrl: string;
    imagePosition: 'left' | 'right';
    buttonText?: string;
    buttonUrl?: string;
    style: 'default' | 'rounded' | 'shadow' | 'bordered';
}

export interface ImageGallerySection {
    type: 'image-gallery';
    id: string;
    title?: string;
    images: { url: string; caption?: string }[];
    columns: 2 | 3 | 4 | 5;
    gap: 'none' | 'small' | 'medium' | 'large';
}

export interface HtmlBlockSection {
    type: 'html-block';
    id: string;
    title?: string;
    content: string;
    fullWidth: boolean;
    backgroundColor?: string;
    paddingY: 'none' | 'small' | 'medium' | 'large';
}

export interface CtaSection {
    type: 'cta';
    id: string;
    title: string;
    subtitle?: string;
    buttonText: string;
    buttonUrl: string;
    backgroundColor?: string;
    style: 'default' | 'gradient' | 'bordered';
}

export interface CtaSplitSection {
    type: 'cta-split';
    id: string;
    title: string;
    content: string;
    buttonText: string;
    buttonUrl: string;
    imageUrl: string;
    imagePosition: 'left' | 'right';
}

export interface CtaNewsletterSection {
    type: 'cta-newsletter';
    id: string;
    title: string;
    subtitle?: string;
    placeholder: string;
    buttonText: string;
    backgroundColor?: string;
}

export interface FeaturesSection {
    type: 'features';
    id: string;
    title: string;
    subtitle?: string;
    features: {
        icon: string;
        title: string;
        description: string;
    }[];
    columns: 2 | 3 | 4;
    style: 'cards' | 'simple' | 'bordered' | 'icons-top' | 'icons-left';
}

export interface FeaturesIconsSection {
    type: 'features-icons';
    id: string;
    title: string;
    items: {
        icon: string;
        label: string;
    }[];
}

export interface StatsSection {
    type: 'stats';
    id: string;
    title?: string;
    stats: {
        value: string;
        label: string;
        prefix?: string;
        suffix?: string;
    }[];
    style: 'default' | 'cards' | 'minimal';
}

export interface TestimonialsSection {
    type: 'testimonials';
    id: string;
    title: string;
    testimonials: {
        quote: string;
        author: string;
        role?: string;
        avatar?: string;
        rating?: number;
    }[];
    style: 'cards' | 'carousel' | 'simple' | 'quote';
}

export interface LogosSection {
    type: 'logos';
    id: string;
    title?: string;
    logos: { url: string; alt: string; link?: string }[];
    style: 'default' | 'grayscale' | 'carousel';
}

export interface FaqSection {
    type: 'faq';
    id: string;
    title: string;
    subtitle?: string;
    items: {
        question: string;
        answer: string;
    }[];
    style: 'accordion' | 'cards' | 'simple';
}

export interface PricingSection {
    type: 'pricing';
    id: string;
    title: string;
    subtitle?: string;
    plans: {
        name: string;
        price: string;
        period: string;
        features: string[];
        buttonText: string;
        buttonUrl: string;
        highlighted?: boolean;
    }[];
}

export interface TeamSection {
    type: 'team';
    id: string;
    title: string;
    subtitle?: string;
    members: {
        name: string;
        role: string;
        image?: string;
        bio?: string;
        social?: { twitter?: string; linkedin?: string; email?: string };
    }[];
    columns: 3 | 4;
}

export interface ContactSection {
    type: 'contact';
    id: string;
    title: string;
    subtitle?: string;
    email?: string;
    phone?: string;
    address?: string;
    showMap?: boolean;
    mapEmbed?: string;
}

export interface DividerSection {
    type: 'divider';
    id: string;
    style: 'line' | 'dashed' | 'dotted' | 'gradient' | 'wave';
    color?: string;
}

export interface RichTextSection {
    type: 'rich-text';
    id: string;
    title?: string;
    content: string;
    alignment: 'left' | 'center' | 'right';
    backgroundColor?: string;
    textColor?: string;
    paddingY: 'small' | 'medium' | 'large';
}

export interface VideoSection {
    type: 'video';
    id: string;
    title?: string;
    videoUrl: string;
    coverImage?: string;
    autoPlay: boolean;
    aspectRatio: '16:9' | '4:3' | '21:9';
    fullWidth: boolean;
}

export interface SpacerSection {
    type: 'spacer';
    id: string;
    height: 'small' | 'medium' | 'large' | 'xlarge';
}

export type HomepageSection =
    | HeroSection
    | HeroVideoSection
    | HeroSliderSection
    | PostsSection
    | CategoryTabsSection
    | ImageTextSection
    | ImageGallerySection
    | HtmlBlockSection
    | RichTextSection
    | VideoSection
    | CtaSection
    | CtaSplitSection
    | CtaNewsletterSection
    | FeaturesSection
    | FeaturesIconsSection
    | StatsSection
    | TestimonialsSection
    | LogosSection
    | FaqSection
    | PricingSection
    | TeamSection
    | ContactSection
    | DividerSection
    | SpacerSection;

export interface ThemeColors {
    background: string;
    foreground: string;
    primary: string;
    primaryForeground: string;
    secondary: string;
    secondaryForeground: string;
    accent: string;
    accentForeground: string;
    muted: string;
    border: string;
    card: string;
}

export interface SiteConfig {
    wordpressUrl: string;
    installed: boolean;
    colors: ThemeColors;
    siteName: string;
    footerText?: string;

    // Plugin Integrations
    plugins?: {
        seo?: {
            enabled: boolean;
            provider: 'yoast' | 'rankmath' | 'default';
        };
        acf?: {
            enabled: boolean;
            showInFrontend: boolean;
        };
        contactForm7?: {
            enabled: boolean;
        };
        comments?: {
            enabled: boolean;
        };
    };
    logoUrl: string;
    homeTemplate: 'grid' | 'list' | 'magazine';
    homeCategory: number;
    homepageSections: HomepageSection[];
    menus: {
        primary: MenuItem[];
        footer: MenuItem[];
    };
    language: string;
    topBar?: {
        enabled: boolean;
        statusText: string;
        statusLinkText: string;
        statusLinkUrl: string;
    };
    headerCta?: {
        text: string;
        url: string;
    };
    socialLinks?: {
        platform: 'facebook' | 'twitter' | 'instagram' | 'youtube' | 'linkedin' | 'tiktok';
        url: string;
    }[];
    auth?: {
        username: string;
        passwordHash: string;
        // Secret used to sign manager session tokens. Generated on install.
        // Never sent to the client (stripped by getConfig()).
        sessionSecret?: string;
    };
    gaId?: string;
    seo?: {
        homepageTitle: string;
        homepageDescription: string;
        urlStructure: string;
        categoryBase?: string;
        tagBase?: string;
    };
    codeInjection?: {
        head: string;
        body: string;
    };
    postSettings?: {
        relatedPosts: {
            enabled: boolean;
            title?: string;
            count?: number;
        };
    };
    ads?: AdSlot[];
    uiStrings?: {
        readMore: string;
        relatedPosts: string;
        latestPosts: string;
        categories: string;
        tags: string;
        share: string;
        search: string;
        searchPlaceholder: string;
        noResults: string;
        loadMore: string;
        readingTime: string;
        author: string;
    };
}

export interface AdSlot {
    id: string;         // e.g., 'header_top', 'sidebar_top'
    label: string;      // Human readable name e.g., 'Header Top'
    location: string;   // Description of where it appears
    size: string;       // Recommended size e.g., '728x90'
    active: boolean;    // Is it enabled?
    code: string;       // HTML/JS code
}

// Section categories for organized UI
export const sectionCategories = {
    hero: {
        label: 'Hero Sections',
        icon: '🎯',
        types: ['hero', 'hero-video', 'hero-slider'] as SectionType[],
    },
    posts: {
        label: 'Posts & Content',
        icon: '📰',
        types: ['posts-grid', 'posts-list', 'posts-magazine', 'posts-carousel', 'posts-masonry', 'posts-cards', 'posts-minimal', 'posts-overlay', 'category-tabs'] as SectionType[],
    },
    media: {
        label: 'Media & Images',
        icon: '🖼️',
        types: ['rich-text', 'image-text', 'image-gallery', 'video'] as SectionType[],
    },
    cta: {
        label: 'Call to Action',
        icon: '📣',
        types: ['cta', 'cta-split', 'cta-newsletter'] as SectionType[],
    },
    features: {
        label: 'Features & Stats',
        icon: '⭐',
        types: ['features', 'features-icons', 'stats'] as SectionType[],
    },
    social: {
        label: 'Social Proof',
        icon: '💬',
        types: ['testimonials', 'logos'] as SectionType[],
    },
    info: {
        label: 'Information',
        icon: '📋',
        types: ['faq', 'pricing', 'team', 'contact'] as SectionType[],
    },
    layout: {
        label: 'Layout',
        icon: '📐',
        types: ['html-block', 'divider', 'spacer'] as SectionType[],
    },
};

// Section type labels for UI
export const sectionTypeLabels: Record<SectionType, string> = {
    'hero': 'Hero Banner',
    'hero-video': 'Hero with Video',
    'hero-slider': 'Hero Slider',
    'posts-grid': 'Posts Grid',
    'posts-list': 'Posts List',
    'posts-magazine': 'Posts Magazine',
    'posts-carousel': 'Posts Carousel',
    'posts-masonry': 'Posts Masonry',
    'posts-cards': 'Posts Cards',
    'posts-minimal': 'Posts Minimal',
    'posts-overlay': 'Posts Overlay',
    'category-tabs': 'Category Tabs',
    'image-text': 'Image + Text',
    'image-gallery': 'Image Gallery',
    'html-block': 'HTML Block',
    'rich-text': 'Rich Text',
    'video': 'Video Embed',
    'cta': 'Call to Action',
    'cta-split': 'Split CTA',
    'cta-newsletter': 'Newsletter CTA',
    'features': 'Features Grid',
    'features-icons': 'Features Icons',
    'stats': 'Statistics',
    'testimonials': 'Testimonials',
    'logos': 'Logo Cloud',
    'faq': 'FAQ',
    'pricing': 'Pricing Table',
    'team': 'Team Members',
    'contact': 'Contact Info',
    'divider': 'Divider',
    'spacer': 'Spacer',
};

// Section descriptions for UI
export const sectionDescriptions: Record<SectionType, string> = {
    'hero': 'Full-width banner with title, subtitle and buttons',
    'hero-video': 'Hero with background video',
    'hero-slider': 'Slideshow hero with multiple slides',
    'posts-grid': '3-column grid of posts',
    'posts-list': 'Vertical list of posts',
    'posts-magazine': 'Featured post with grid',
    'posts-carousel': 'Horizontal scrolling posts',
    'posts-masonry': 'Pinterest-style layout',
    'posts-cards': 'Cards with shadows',
    'posts-minimal': 'Clean, text-focused layout',
    'posts-overlay': 'Text over image',
    'category-tabs': 'Tabbed category browser',
    'image-text': 'Side-by-side image and text',
    'image-gallery': 'Grid of images',
    'rich-text': 'Formatted text content block',
    'video': 'Video player or embed',
    'html-block': 'Custom HTML content',
    'cta': 'Colored call-to-action banner',
    'cta-split': 'Image with CTA side-by-side',
    'cta-newsletter': 'Email signup form',
    'features': 'Feature cards with icons',
    'features-icons': 'Icon row with labels',
    'stats': 'Number statistics display',
    'testimonials': 'Customer quotes',
    'logos': 'Partner/client logos',
    'faq': 'Frequently asked questions',
    'pricing': 'Pricing plans comparison',
    'team': 'Team member profiles',
    'contact': 'Contact information',
    'divider': 'Visual separator line',
    'spacer': 'Empty vertical space',
};

// Helper to generate unique section IDs (client-safe)
export const generateSectionId = (): string => {
    return `section_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Default section templates
export const getDefaultSection = (type: SectionType): HomepageSection => {
    const id = generateSectionId();

    switch (type) {
        case 'hero':
            return {
                type: 'hero',
                id,
                title: 'Welcome to Our Site',
                subtitle: 'Discover amazing content powered by WordPress and Next.js',
                buttonText: 'Get Started',
                buttonUrl: '#',
                alignment: 'center',
                height: 'large',
                overlay: true,
            };
        case 'rich-text':
            return {
                type: 'rich-text',
                id,
                title: 'Our Mission',
                content: '<p>Write your mission statement or company description here. This section is perfect for purely text-based content.</p>',
                alignment: 'center',
                paddingY: 'medium',
            };
        case 'video':
            return {
                type: 'video',
                id,
                title: 'Watch Video',
                videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                autoPlay: false,
                aspectRatio: '16:9',
                fullWidth: false,
            };
        case 'hero-video':
            return {
                type: 'hero-video',
                id,
                title: 'Experience the Difference',
                subtitle: 'Watch our story unfold',
                buttonText: 'Learn More',
                buttonUrl: '#',
                videoUrl: '',
                posterImage: '',
            };
        case 'hero-slider':
            return {
                type: 'hero-slider',
                id,
                slides: [
                    { title: 'Slide 1', subtitle: 'First slide description', buttonText: 'Learn More', buttonUrl: '#', backgroundImage: '' },
                    { title: 'Slide 2', subtitle: 'Second slide description', buttonText: 'Get Started', buttonUrl: '#', backgroundImage: '' },
                ],
                autoPlay: true,
                interval: 5000,
            };
        case 'posts-grid':
            return {
                type: 'posts-grid',
                id,
                title: 'Latest Posts',
                categoryId: 0,
                postCount: 6,
                showViewAll: true,
                columns: 3,
                showExcerpt: true,
                showImage: true,
                showCategory: true,
                showDate: true,
                showAuthor: false,
            };
        case 'posts-list':
            return {
                type: 'posts-list',
                id,
                title: 'Recent Articles',
                categoryId: 0,
                postCount: 5,
                showViewAll: true,
                showExcerpt: true,
                showImage: true,
                showCategory: true,
                showDate: true,
                showAuthor: true,
            };
        case 'posts-magazine':
            return {
                type: 'posts-magazine',
                id,
                title: 'Featured Stories',
                categoryId: 0,
                postCount: 5,
                showViewAll: true,
            };
        case 'posts-carousel':
            return {
                type: 'posts-carousel',
                id,
                title: 'More to Read',
                categoryId: 0,
                postCount: 8,
                showViewAll: true,
            };
        case 'posts-masonry':
            return {
                type: 'posts-masonry',
                id,
                title: 'Explore',
                categoryId: 0,
                postCount: 9,
                showViewAll: true,
                columns: 3,
            };
        case 'posts-cards':
            return {
                type: 'posts-cards',
                id,
                title: 'Featured',
                categoryId: 0,
                postCount: 6,
                showViewAll: true,
                columns: 3,
                showExcerpt: true,
            };
        case 'posts-minimal':
            return {
                type: 'posts-minimal',
                id,
                title: 'Latest',
                categoryId: 0,
                postCount: 5,
                showViewAll: true,
            };
        case 'posts-overlay':
            return {
                type: 'posts-overlay',
                id,
                title: 'Stories',
                categoryId: 0,
                postCount: 4,
                showViewAll: true,
                columns: 4,
            };
        case 'category-tabs':
            return {
                type: 'category-tabs',
                id,
                title: 'Browse by Category',
                categories: [],
                postCount: 4,
                layout: 'grid',
            };
        case 'image-text':
            return {
                type: 'image-text',
                id,
                title: 'About Us',
                content: '<p>Write your content here. You can use <strong>bold</strong>, <em>italic</em>, and other HTML formatting.</p>',
                imageUrl: '',
                imagePosition: 'right',
                buttonText: 'Learn More',
                buttonUrl: '#',
                style: 'default',
            };
        case 'image-gallery':
            return {
                type: 'image-gallery',
                id,
                title: 'Gallery',
                images: [],
                columns: 3,
                gap: 'medium',
            };
        case 'html-block':
            return {
                type: 'html-block',
                id,
                title: '',
                content: '<div style="text-align: center;"><h2>Custom Section</h2><p>Add any HTML content here.</p></div>',
                fullWidth: false,
                paddingY: 'medium',
            };
        case 'cta':
            return {
                type: 'cta',
                id,
                title: 'Ready to Get Started?',
                subtitle: 'Join thousands of satisfied customers today.',
                buttonText: 'Contact Us',
                buttonUrl: '/contact',
                backgroundColor: '#0070f3',
                style: 'default',
            };
        case 'cta-split':
            return {
                type: 'cta-split',
                id,
                title: 'Start Your Journey',
                content: '<p>Take the first step towards something amazing.</p>',
                buttonText: 'Get Started',
                buttonUrl: '#',
                imageUrl: '',
                imagePosition: 'right',
            };
        case 'cta-newsletter':
            return {
                type: 'cta-newsletter',
                id,
                title: 'Stay Updated',
                subtitle: 'Subscribe to our newsletter for the latest updates.',
                placeholder: 'Enter your email',
                buttonText: 'Subscribe',
                backgroundColor: '#1a1a1a',
            };
        case 'features':
            return {
                type: 'features',
                id,
                title: 'Our Features',
                subtitle: 'What makes us different',
                features: [
                    { icon: '⚡', title: 'Fast', description: 'Lightning fast performance' },
                    { icon: '🔒', title: 'Secure', description: 'Enterprise-grade security' },
                    { icon: '🎨', title: 'Beautiful', description: 'Stunning modern design' },
                ],
                columns: 3,
                style: 'cards',
            };
        case 'features-icons':
            return {
                type: 'features-icons',
                id,
                title: 'Why Choose Us',
                items: [
                    { icon: '✓', label: 'Free Shipping' },
                    { icon: '🔄', label: '30 Day Returns' },
                    { icon: '🔒', label: 'Secure Checkout' },
                    { icon: '📞', label: '24/7 Support' },
                ],
            };
        case 'stats':
            return {
                type: 'stats',
                id,
                title: 'By the Numbers',
                stats: [
                    { value: '10', label: 'Years Experience', suffix: '+' },
                    { value: '500', label: 'Happy Clients', suffix: '+' },
                    { value: '1000', label: 'Projects Done', suffix: '+' },
                    { value: '24', label: 'Support', suffix: '/7' },
                ],
                style: 'cards',
            };
        case 'testimonials':
            return {
                type: 'testimonials',
                id,
                title: 'What People Say',
                testimonials: [
                    { quote: 'Amazing product! Exceeded all expectations.', author: 'John Doe', role: 'CEO', rating: 5 },
                    { quote: 'Highly recommended for any business.', author: 'Jane Smith', role: 'Designer', rating: 5 },
                ],
                style: 'cards',
            };
        case 'logos':
            return {
                type: 'logos',
                id,
                title: 'Trusted By',
                logos: [],
                style: 'grayscale',
            };
        case 'faq':
            return {
                type: 'faq',
                id,
                title: 'Frequently Asked Questions',
                subtitle: 'Got questions? We have answers.',
                items: [
                    { question: 'How does it work?', answer: 'Simply sign up and get started.' },
                    { question: 'What is the cost?', answer: 'We offer flexible pricing plans.' },
                ],
                style: 'accordion',
            };
        case 'pricing':
            return {
                type: 'pricing',
                id,
                title: 'Choose Your Plan',
                subtitle: 'Simple, transparent pricing',
                plans: [
                    { name: 'Starter', price: '$9', period: '/month', features: ['Feature 1', 'Feature 2'], buttonText: 'Get Started', buttonUrl: '#' },
                    { name: 'Pro', price: '$29', period: '/month', features: ['Everything in Starter', 'Feature 3', 'Feature 4'], buttonText: 'Get Started', buttonUrl: '#', highlighted: true },
                ],
            };
        case 'team':
            return {
                type: 'team',
                id,
                title: 'Meet Our Team',
                subtitle: 'The people behind the magic',
                members: [
                    { name: 'John Doe', role: 'CEO' },
                    { name: 'Jane Smith', role: 'CTO' },
                    { name: 'Bob Johnson', role: 'Designer' },
                ],
                columns: 3,
            };
        case 'contact':
            return {
                type: 'contact',
                id,
                title: 'Get in Touch',
                subtitle: 'We would love to hear from you',
                email: 'hello@example.com',
                phone: '+1 234 567 890',
                address: '123 Main St, City',
                showMap: false,
            };
        case 'divider':
            return {
                type: 'divider',
                id,
                style: 'line',
            };
        case 'spacer':
            return {
                type: 'spacer',
                id,
                height: 'medium',
            };
    }
};
