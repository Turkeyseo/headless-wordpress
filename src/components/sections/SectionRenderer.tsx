'use client';

import Link from 'next/link';
import Image from 'next/image';
import parse from 'html-react-parser';
import {
    HomepageSection,
    CategoryTabsSection,
    HeroSection,
    HeroVideoSection,
    HeroSliderSection,
    CtaSplitSection,
    CtaNewsletterSection,
    FeaturesIconsSection,
    StatsSection,
    LogosSection,
    FaqSection,
    PricingSection,
    TeamSection,
    ContactSection,
    DividerSection,
    SpacerSection,
    ImageGallerySection,
    PostsSection,
    ImageTextSection,
    HtmlBlockSection,
    CtaSection,
    FeaturesSection,
    TestimonialsSection,
    RichTextSection,
    VideoSection,
} from '@/lib/config-types';
import { WPPost, WPCategory } from '@/lib/wordpress';
import { useState, useEffect } from 'react';
import PostGrid from '@/components/ui/PostGrid';
import styles from './SectionRenderer.module.css';
import {
    Check, Plus, Minus, Mail, Phone, MapPin, Play,
    Zap, Shield, Smartphone, Globe, Lock, Server, Database, Cloud, Cpu,
    Code, Terminal, Layout, Activity, TrendingUp, BarChart, PieChart,
    Users, User, Rocket, Target, Award
} from 'lucide-react';

const iconMap: Record<string, React.ElementType> = {
    Zap, Shield, Smartphone, Globe, Lock, Server, Database, Cloud, Cpu,
    Code, Terminal, Layout, Activity, TrendingUp, BarChart, PieChart,
    Users, User, Rocket, Target, Award, Check, Mail, Phone, MapPin, Play
};

interface SectionRendererProps {
    section: HomepageSection;
    posts?: WPPost[];
    categories?: WPCategory[];
}

export default function SectionRenderer({ section, posts = [], categories = [] }: SectionRendererProps) {
    switch (section.type) {
        case 'hero':
            return <HeroRenderer section={section} />;
        case 'posts-grid':
        case 'posts-list':
        case 'posts-magazine':
        case 'posts-carousel':
        case 'posts-masonry':
        case 'posts-cards':
        case 'posts-minimal':
        case 'posts-overlay':
            return <PostsRenderer section={section} posts={posts} />;
        case 'image-text':
            return <ImageTextRenderer section={section} />;
        case 'html-block':
            return <HtmlBlockRenderer section={section} />;
        case 'cta':
            return <CtaRenderer section={section} />;
        case 'features':
            return <FeaturesRenderer section={section} />;
        case 'testimonials':
            return <TestimonialsRenderer section={section} />;
        case 'category-tabs':
            return <CategoryTabsRenderer section={section} posts={posts} categories={categories} />;
        case 'hero-video': return <HeroVideoRenderer section={section} />;
        case 'hero-slider': return <HeroSliderRenderer section={section} />;
        case 'cta-split': return <CtaSplitRenderer section={section} />;
        case 'cta-newsletter': return <CtaNewsletterRenderer section={section} />;
        case 'features-icons': return <FeaturesIconsRenderer section={section} />;
        case 'stats': return <StatsRenderer section={section} />;
        case 'logos': return <LogosRenderer section={section} />;
        case 'faq': return <FaqRenderer section={section} />;
        case 'pricing': return <PricingRenderer section={section} />;
        case 'team': return <TeamRenderer section={section} />;
        case 'contact': return <ContactRenderer section={section} />;
        case 'divider': return <DividerRenderer section={section} />;
        case 'spacer': return <SpacerRenderer section={section} />;
        case 'image-gallery': return <ImageGalleryRenderer section={section} />;
        case 'rich-text': return <RichTextRenderer section={section} />;
        case 'video': return <VideoRenderer section={section} />;
        default:
            return null;
    }
}

// Hero Section
function HeroRenderer({ section }: { section: HeroSection }) {
    return (
        <section
            className={styles.heroSection}
            style={section.backgroundImage ? { backgroundImage: `url(${section.backgroundImage})` } : {}}
        >
            <div className={styles.heroOverlay} />
            <div className={`${styles.heroContent} ${styles[`align${section.alignment.charAt(0).toUpperCase() + section.alignment.slice(1)}`]}`}>
                <h1 className={styles.heroTitle}>{section.title}</h1>
                {section.subtitle && (
                    <p className={styles.heroSubtitle}>{section.subtitle}</p>
                )}
                {section.buttonText && section.buttonUrl && (
                    <Link href={section.buttonUrl} className={styles.heroButton}>
                        {section.buttonText}
                    </Link>
                )}
            </div>
        </section>
    );
}

// Posts Section
function PostsRenderer({ section, posts }: { section: PostsSection; posts: WPPost[] }) {
    const getLayout = () => {
        switch (section.type) {
            case 'posts-list': return 'list';
            case 'posts-magazine': return 'magazine';
            case 'posts-carousel': return 'carousel';
            case 'posts-masonry': return 'masonry';
            case 'posts-cards': return 'cards';
            case 'posts-overlay': return 'overlay';
            case 'posts-minimal': return 'minimal';
            default: return 'grid';
        }
    };
    const layout = getLayout();

    return (
        <section className={styles.postsSection}>
            <div className={styles.container}>
                {section.title && (
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>{section.title}</h2>
                        {section.showViewAll && (
                            <Link href={section.categoryId ? `/category/${section.categoryId}` : '/'} className={styles.viewAllLink}>
                                View All →
                            </Link>
                        )}
                    </div>
                )}
                <PostGrid posts={posts.slice(0, section.postCount)} layout={layout} />
            </div>
        </section>
    );
}

// Image + Text Section
function ImageTextRenderer({ section }: { section: ImageTextSection }) {
    return (
        <section className={styles.imageTextSection}>
            <div className={styles.container}>
                <div className={`${styles.imageTextGrid} ${section.imagePosition === 'left' ? styles.imageLeft : styles.imageRight}`}>
                    <div className={styles.imageTextImage}>
                        {section.imageUrl ? (
                            <Image
                                src={section.imageUrl}
                                alt={section.title}
                                width={600}
                                height={400}
                                className={styles.image}
                            />
                        ) : (
                            <div className={styles.imagePlaceholder}>
                                <span>Add an image</span>
                            </div>
                        )}
                    </div>
                    <div className={styles.imageTextContent}>
                        <h2 className={styles.imageTextTitle}>{section.title}</h2>
                        <div className={styles.imageTextBody}>
                            {parse(section.content)}
                        </div>
                        {section.buttonText && section.buttonUrl && (
                            <Link href={section.buttonUrl} className={styles.imageTextButton}>
                                {section.buttonText}
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}

// HTML Block Section
function HtmlBlockRenderer({ section }: { section: HtmlBlockSection }) {
    return (
        <section className={`${styles.htmlBlockSection} ${section.fullWidth ? styles.fullWidth : ''}`}>
            {!section.fullWidth && <div className={styles.container}>
                {section.title && <h2 className={styles.sectionTitle}>{section.title}</h2>}
                <div className={styles.htmlContent}>
                    {parse(section.content)}
                </div>
            </div>}
            {section.fullWidth && (
                <div className={styles.htmlContent}>
                    {parse(section.content)}
                </div>
            )}
        </section>
    );
}

// CTA Section
function CtaRenderer({ section }: { section: CtaSection }) {
    return (
        <section
            className={styles.ctaSection}
            style={{ backgroundColor: section.backgroundColor || '#0070f3' }}
        >
            <div className={styles.container}>
                <div className={styles.ctaContent}>
                    <h2 className={styles.ctaTitle}>{section.title}</h2>
                    {section.subtitle && (
                        <p className={styles.ctaSubtitle}>{section.subtitle}</p>
                    )}
                    <Link href={section.buttonUrl} className={styles.ctaButton}>
                        {section.buttonText}
                    </Link>
                </div>
            </div>
        </section>
    );
}

// Features Section
function FeaturesRenderer({ section }: { section: FeaturesSection }) {
    return (
        <section className={styles.featuresSection}>
            <div className={styles.container}>
                <div className={styles.featuresHeader}>
                    <h2 className={styles.sectionTitle}>{section.title}</h2>
                    {section.subtitle && (
                        <p className={styles.featuresSubtitle}>{section.subtitle}</p>
                    )}
                </div>
                <div className={styles.featuresGrid}>
                    {section.features.map((feature, index) => (
                        <div key={index} className={styles.featureCard}>
                            <span className={styles.featureIcon}>{feature.icon}</span>
                            <h3 className={styles.featureTitle}>{feature.title}</h3>
                            <p className={styles.featureDescription}>{feature.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// Testimonials Section
function TestimonialsRenderer({ section }: { section: TestimonialsSection }) {
    return (
        <section className={styles.testimonialsSection}>
            <div className={styles.container}>
                <h2 className={styles.sectionTitle}>{section.title}</h2>
                <div className={styles.testimonialsGrid}>
                    {section.testimonials.map((testimonial, index) => (
                        <div key={index} className={styles.testimonialCard}>
                            <blockquote className={styles.testimonialQuote}>
                                &ldquo;{testimonial.quote}&rdquo;
                            </blockquote>
                            <div className={styles.testimonialAuthor}>
                                {testimonial.avatar && (
                                    <Image
                                        src={testimonial.avatar}
                                        alt={testimonial.author}
                                        width={48}
                                        height={48}
                                        className={styles.testimonialAvatar}
                                    />
                                )}
                                <div>
                                    <div className={styles.testimonialName}>{testimonial.author}</div>
                                    {testimonial.role && (
                                        <div className={styles.testimonialRole}>{testimonial.role}</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// Category Tabs Section
function CategoryTabsRenderer({ section, posts, categories }: { section: CategoryTabsSection; posts: WPPost[]; categories: WPCategory[] }) {
    const [activeTab, setActiveTab] = useState<number>(section.categories[0] || 0);

    const activePosts = posts.filter(post =>
        post.categories?.nodes.some(cat => cat.databaseId === activeTab)
    );

    // Get category objects for the tabs
    const sectionCategories = section.categories
        .map(id => categories.find(c => c.databaseId === id))
        .filter((c): c is WPCategory => !!c);

    // If no categories found or no categories configured, don't render tabs properly or show empty
    if (sectionCategories.length === 0 && section.categories.length > 0) {
        // Fallback if categories data isn't available but IDs are
        return null;
    }

    return (
        <section className={styles.categoryTabsSection}>
            <div className={styles.container}>
                <div className={styles.categoryTabsHeader}>
                    <h2 className={styles.sectionTitle}>{section.title}</h2>
                    <div className={styles.tabsContainer}>
                        {sectionCategories.map(category => (
                            <button
                                key={category.id}
                                className={`${styles.tabButton} ${activeTab === category.databaseId ? styles.activeTab : ''}`}
                                onClick={() => setActiveTab(category.databaseId)}
                            >
                                {category.name}
                            </button>
                        ))}
                    </div>
                </div>

                <div className={styles.tabContent}>
                    {activePosts.length > 0 ? (
                        <PostGrid posts={activePosts.slice(0, section.postCount)} layout={section.layout} />
                    ) : (
                        <div className={styles.emptyTab}>
                            <p>No posts found in this category.</p>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}

// Hero With Video Section
function HeroVideoRenderer({ section }: { section: HeroVideoSection }) {
    return (
        <section className={styles.heroVideoSection}>
            <div className={styles.videoBackground}>
                {section.videoUrl && (
                    <video autoPlay loop muted playsInline poster={section.posterImage}>
                        <source src={section.videoUrl} type="video/mp4" />
                    </video>
                )}
                <div className={styles.videoOverlay} />
            </div>
            <div className={styles.container}>
                <div className={styles.heroContent}>
                    <h1 className={styles.heroTitle}>{section.title}</h1>
                    {section.subtitle && <p className={styles.heroSubtitle}>{section.subtitle}</p>}
                    {section.buttonText && section.buttonUrl && (
                        <Link href={section.buttonUrl} className={styles.heroButton}>
                            {section.buttonText}
                        </Link>
                    )}
                </div>
            </div>
        </section>
    );
}

// Hero Slider Section
function HeroSliderRenderer({ section }: { section: HeroSliderSection }) {
    const [currentSlide, setCurrentSlide] = useState(0);

    useEffect(() => {
        if (!section.autoPlay) return;
        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % section.slides.length);
        }, section.interval || 5000);
        return () => clearInterval(interval);
    }, [section.autoPlay, section.interval, section.slides.length]);

    if (!section.slides || section.slides.length === 0) return null;

    return (
        <section className={styles.heroSliderSection}>
            {section.slides.map((slide, index) => (
                <div
                    key={index}
                    className={`${styles.heroSlide} ${index === currentSlide ? styles.activeSlide : ''}`}
                    style={slide.backgroundImage ? { backgroundImage: `url(${slide.backgroundImage})` } : {}}
                >
                    <div className={styles.heroOverlay} />
                    <div className={styles.container}>
                        <div className={styles.heroContent}>
                            <h1 className={styles.heroTitle}>{slide.title}</h1>
                            {slide.subtitle && <p className={styles.heroSubtitle}>{slide.subtitle}</p>}
                            {slide.buttonText && slide.buttonUrl && (
                                <Link href={slide.buttonUrl} className={styles.heroButton}>
                                    {slide.buttonText}
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            ))}
            {section.slides.length > 1 && (
                <div className={styles.sliderDots}>
                    {section.slides.map((_, index) => (
                        <button
                            key={index}
                            className={`${styles.sliderDot} ${index === currentSlide ? styles.activeDot : ''}`}
                            onClick={() => setCurrentSlide(index)}
                        />
                    ))}
                </div>
            )}
        </section>
    );
}

// CTA Split Section
function CtaSplitRenderer({ section }: { section: CtaSplitSection }) {
    return (
        <section className={styles.ctaSplitSection}>
            <div className={styles.container}>
                <div className={`${styles.ctaSplitGrid} ${section.imagePosition === 'right' ? styles.imageRight : ''}`}>
                    <div className={styles.ctaSplitContent}>
                        <h2 className={styles.ctaSplitTitle}>{section.title}</h2>
                        <div className={styles.ctaSplitBody}>{parse(section.content)}</div>
                        {section.buttonText && section.buttonUrl && (
                            <Link href={section.buttonUrl} className={styles.ctaSplitButton}>
                                {section.buttonText}
                            </Link>
                        )}
                    </div>
                    <div className={styles.ctaSplitImageWrapper}>
                        {section.imageUrl ? (
                            <Image
                                src={section.imageUrl}
                                alt={section.title}
                                width={600}
                                height={400}
                                className={styles.ctaSplitImage}
                            />
                        ) : (
                            <div className={styles.imagePlaceholder}>Image</div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}

// CTA Newsletter Section
function CtaNewsletterRenderer({ section }: { section: CtaNewsletterSection }) {
    return (
        <section className={styles.newsletterSection} style={{ backgroundColor: section.backgroundColor || 'var(--primary)' }}>
            <div className={styles.container}>
                <div className={styles.newsletterContent}>
                    <h2 className={styles.newsletterTitle}>{section.title}</h2>
                    {section.subtitle && <p className={styles.newsletterSubtitle}>{section.subtitle}</p>}
                    <form className={styles.newsletterForm} onSubmit={(e) => e.preventDefault()}>
                        <input
                            type="email"
                            placeholder={section.placeholder || 'Enter your email'}
                            className={styles.newsletterInput}
                        />
                        <button type="submit" className={styles.newsletterButton}>{section.buttonText || 'Subscribe'}</button>
                    </form>
                </div>
            </div>
        </section>
    );
}

// Features Icons Section
function FeaturesIconsRenderer({ section }: { section: FeaturesIconsSection }) {
    return (
        <section className={styles.featuresIconsSection}>
            <div className={styles.container}>
                {section.title && <h2 className={styles.sectionTitle}>{section.title}</h2>}
                <div className={styles.featuresIconsGrid}>
                    {section.items.map((item, index) => {
                        const IconComponent = iconMap[item.icon] || (() => <span style={{ fontSize: '1.5rem' }}>{item.icon}</span>);
                        const isLucide = !!iconMap[item.icon];

                        return (
                            <div key={index} className={styles.featureIconItem}>
                                <div className={styles.iconCircle}>
                                    {isLucide ? <IconComponent size={32} strokeWidth={1.5} /> : <IconComponent />}
                                </div>
                                <span className={styles.featureIconLabel}>{item.label}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

// Stats Section
function StatsRenderer({ section }: { section: StatsSection }) {
    return (
        <section className={styles.statsSection}>
            <div className={styles.container}>
                {section.title && <h2 className={styles.sectionTitle}>{section.title}</h2>}
                <div className={styles.statsGrid}>
                    {section.stats.map((stat, index) => (
                        <div key={index} className={styles.statItem}>
                            <div className={styles.statValue}>
                                {stat.prefix}{stat.value}{stat.suffix}
                            </div>
                            <div className={styles.statLabel}>{stat.label}</div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// Logos Section
function LogosRenderer({ section }: { section: LogosSection }) {
    return (
        <section className={`${styles.logosSection} ${section.style === 'grayscale' ? styles.logosGrayscale : ''}`}>
            <div className={styles.container}>
                {section.title && <h3 className={styles.logosTitle}>{section.title}</h3>}
                <div className={styles.logosGrid}>
                    {section.logos.map((logo, index) => (
                        <Link href={logo.link || '#'} key={index} className={styles.logoItem}>
                            <Image
                                src={logo.url}
                                alt={logo.alt || 'Logo'}
                                width={120}
                                height={60}
                                className={styles.logoImage}
                            />
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}

// FAQ Section
function FaqRenderer({ section }: { section: FaqSection }) {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    return (
        <section className={styles.faqSection}>
            <div className={styles.container}>
                <div className={styles.faqHeader}>
                    <h2 className={styles.sectionTitle}>{section.title}</h2>
                    {section.subtitle && <p className={styles.sectionSubtitle}>{section.subtitle}</p>}
                </div>
                <div className={styles.faqList}>
                    {section.items.map((item, index) => (
                        <div key={index} className={`${styles.faqItem} ${openIndex === index ? styles.faqOpen : ''}`}>
                            <button
                                className={styles.faqQuestion}
                                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                            >
                                {item.question}
                                {openIndex === index ? <Minus size={20} /> : <Plus size={20} />}
                            </button>
                            <div className={styles.faqAnswer} style={{ display: openIndex === index ? 'block' : 'none' }}>
                                <p>{item.answer}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// Pricing Section
function PricingRenderer({ section }: { section: PricingSection }) {
    return (
        <section className={styles.pricingSection}>
            <div className={styles.container}>
                <div className={styles.pricingHeader}>
                    <h2 className={styles.sectionTitle}>{section.title}</h2>
                    {section.subtitle && <p className={styles.sectionSubtitle}>{section.subtitle}</p>}
                </div>
                <div className={styles.pricingGrid}>
                    {section.plans.map((plan, index) => (
                        <div key={index} className={`${styles.pricingCard} ${plan.highlighted ? styles.pricingPopular : ''}`}>
                            {plan.highlighted && <span className={styles.popularTag}>Most Popular</span>}
                            <h3 className={styles.planName}>{plan.name}</h3>
                            <div className={styles.planPrice}>
                                <span className={styles.priceAmount}>{plan.price}</span>
                                {plan.period && <span className={styles.pricePeriod}>/{plan.period}</span>}
                            </div>
                            <ul className={styles.planFeatures}>
                                {plan.features.map((feature, fIndex) => (
                                    <li key={fIndex}>
                                        <Check size={16} className={styles.featureCheck} />
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                            <Link href={plan.buttonUrl} className={`${styles.planButton} ${plan.highlighted ? styles.buttonPrimary : styles.buttonOutline}`}>
                                {plan.buttonText}
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// Team Section
function TeamRenderer({ section }: { section: TeamSection }) {
    return (
        <section className={styles.teamSection}>
            <div className={styles.container}>
                <div className={styles.teamHeader}>
                    <h2 className={styles.sectionTitle}>{section.title}</h2>
                    {section.subtitle && <p className={styles.sectionSubtitle}>{section.subtitle}</p>}
                </div>
                <div className={styles.teamGrid} style={{ gridTemplateColumns: `repeat(${section.columns || 4}, 1fr)` }}>
                    {section.members.map((member, index) => (
                        <div key={index} className={styles.teamMember}>
                            <div className={styles.memberImageWrapper}>
                                {member.image ? (
                                    <Image
                                        src={member.image}
                                        alt={member.name}
                                        width={300}
                                        height={300}
                                        className={styles.memberImage}
                                    />
                                ) : (
                                    <div className={styles.memberPlaceholder} />
                                )}
                            </div>
                            <h3 className={styles.memberName}>{member.name}</h3>
                            <p className={styles.memberRole}>{member.role}</p>
                            {member.bio && <p className={styles.memberBio}>{member.bio}</p>}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// Contact Section
function ContactRenderer({ section }: { section: ContactSection }) {
    return (
        <section className={styles.contactSection}>
            <div className={styles.container}>
                <div className={styles.contactWrapper}>
                    <div className={styles.contactInfo}>
                        <h2 className={styles.contactTitle}>{section.title}</h2>
                        {section.subtitle && <p className={styles.contactSubtitle}>{section.subtitle}</p>}
                        <div className={styles.contactDetails}>
                            {section.email && (
                                <div className={styles.contactDetail}>
                                    <Mail className={styles.contactIcon} />
                                    <span>{section.email}</span>
                                </div>
                            )}
                            {section.phone && (
                                <div className={styles.contactDetail}>
                                    <Phone className={styles.contactIcon} />
                                    <span>{section.phone}</span>
                                </div>
                            )}
                            {section.address && (
                                <div className={styles.contactDetail}>
                                    <MapPin className={styles.contactIcon} />
                                    <span>{section.address}</span>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className={styles.contactFormWrapper}>
                        {/* Placeholder form since we don't have backend logic for it yet */}
                        <form className={styles.contactForm}>
                            <div className={styles.formGroup}>
                                <label>Name</label>
                                <input type="text" className={styles.formInput} />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Email</label>
                                <input type="email" className={styles.formInput} />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Message</label>
                                <textarea className={styles.formTextarea} rows={4} />
                            </div>
                            <button type="button" className={styles.submitButton}>Send Message</button>
                        </form>
                    </div>
                </div>
            </div>
        </section>
    );
}

// Divider Section
function DividerRenderer({ section }: { section: DividerSection }) {
    const getBorderStyle = () => {
        if (section.style === 'line') return 'solid';
        if (section.style === 'gradient' || section.style === 'wave') return 'solid'; // Fallback
        return section.style;
    };

    return (
        <div className={styles.dividerSection}>
            {section.style === 'gradient' ? (
                <div className={styles.dividerGradient} style={{ height: 2, background: 'linear-gradient(to right, transparent, var(--foreground), transparent)' }} />
            ) : (
                <hr
                    className={styles.divider}
                    style={{
                        borderTopStyle: getBorderStyle(),
                        borderColor: section.color || 'var(--border)'
                    }}
                />
            )}
        </div>
    );
}

// Spacer Section
function SpacerRenderer({ section }: { section: SpacerSection }) {
    return <div style={{ height: section.height || 50 }} />;
}

// Image Gallery Section
function ImageGalleryRenderer({ section }: { section: ImageGallerySection }) {
    return (
        <section className={styles.gallerySection}>
            <div className={styles.container}>
                {section.title && <h2 className={styles.sectionTitle}>{section.title}</h2>}
                <div className={styles.galleryGrid} style={{
                    gridTemplateColumns: `repeat(${section.columns || 3}, 1fr)`,
                    gap: section.gap || 16
                }}>
                    {section.images.map((img, index) => (
                        <div key={index} className={styles.galleryItem}>
                            <Image
                                src={typeof img === 'string' ? img : img.url}
                                alt={typeof img === 'string' ? `Gallery ${index}` : img.caption || ''}
                                width={400}
                                height={300}
                                className={styles.galleryImage}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// Rich Text Section
function RichTextRenderer({ section }: { section: RichTextSection }) {
    return (
        <section
            className={styles.richTextSection}
            style={{
                backgroundColor: section.backgroundColor || 'transparent',
                color: section.textColor || 'inherit',
                paddingBlock: section.paddingY === 'small' ? '2rem' : section.paddingY === 'large' ? '6rem' : '4rem',
                textAlign: section.alignment
            }}
        >
            <div className={styles.container}>
                {section.title && <h2 className={styles.sectionTitle}>{section.title}</h2>}
                <div className={styles.richTextContent}>
                    {parse(section.content)}
                </div>
            </div>
        </section>
    );
}

// Video Section
function VideoRenderer({ section }: { section: VideoSection }) {
    const isYoutube = section.videoUrl.includes('youtube.com') || section.videoUrl.includes('youtu.be');
    const isVimeo = section.videoUrl.includes('vimeo.com');

    let embedUrl = section.videoUrl;
    if (isYoutube) {
        if (section.videoUrl.includes('watch?v=')) {
            embedUrl = section.videoUrl.replace('watch?v=', 'embed/');
        } else if (section.videoUrl.includes('youtu.be/')) {
            embedUrl = section.videoUrl.replace('youtu.be/', 'www.youtube.com/embed/');
        }
    } else if (isVimeo) {
        embedUrl = section.videoUrl.replace('vimeo.com/', 'player.vimeo.com/video/');
    }

    return (
        <section className={styles.videoEmbedSection}>
            <div className={`${styles.container} ${section.fullWidth ? styles.fullWidthContainer : ''}`}>
                {section.title && <h2 className={styles.sectionTitle}>{section.title}</h2>}
                <div className={styles.videoWrapper} style={{ aspectRatio: section.aspectRatio.replace(':', '/') }}>
                    {(isYoutube || isVimeo) ? (
                        <iframe
                            src={embedUrl}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className={styles.videoIframe}
                        />
                    ) : (
                        <video
                            src={section.videoUrl}
                            controls
                            autoPlay={section.autoPlay}
                            loop={section.autoPlay}
                            muted={section.autoPlay}
                            playsInline
                            poster={section.coverImage}
                            className={styles.videoElement}
                        />
                    )}
                </div>
            </div>
        </section>
    );
}
