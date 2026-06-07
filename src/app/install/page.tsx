'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, AlertTriangle, Loader2, Globe, Palette, Zap, ArrowRight, ExternalLink, Lock } from 'lucide-react';
import { testWPConnection, analyzeWPSite, completeInstallation } from '@/lib/actions';
import { WPCategory } from '@/lib/wordpress';
import { HomepageSection, PostsSection } from '@/lib/config-types';
import styles from './install.module.css';

const generateDefaultSections = (categories: WPCategory[]): HomepageSection[] => {
    const sections: HomepageSection[] = [];

    // First: Featured Posts section (Latest 4 posts, magazine layout like the image)
    sections.push({
        id: crypto.randomUUID(),
        type: 'posts-magazine',
        title: '',  // No title for hero-style section
        categoryId: 0,  // 0 = all categories (latest posts)
        postCount: 4,
        showViewAll: false,
        showExcerpt: false,
        showDate: true,
        showAuthor: false,
    } as PostsSection);

    // Then: Category-based sections
    const sorted = [...categories]
        .filter(c => (c.count || 0) > 0)
        .sort((a, b) => (b.count || 0) - (a.count || 0))
        .slice(0, 4);  // Top 4 categories (reduced since we added featured)

    const layouts: ('posts-carousel' | 'posts-grid' | 'posts-masonry' | 'posts-list')[] = [
        'posts-carousel', 'posts-grid', 'posts-masonry', 'posts-list'
    ];

    sorted.forEach((cat, index) => {
        let type: PostsSection['type'] = layouts[index % layouts.length];
        let postCount = 6;
        let columns = 3;

        // Custom config for the first category section (2nd section overall)
        if (index === 0) {
            type = 'posts-overlay';
            postCount = 4;
            columns = 4;
        }

        // Add visual breaks/spacers before certain sections
        if (index === 1) {
            // Add a Split CTA
            sections.push({
                id: crypto.randomUUID(),
                type: 'cta-split',
                title: 'Transform Your Digital Presence',
                content: 'Experience the power of a headless architecture. Fast, secure, and scalable solutions for modern web needs.',
                buttonText: 'Get Started',
                buttonUrl: '#',
                imageUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80',
                imagePosition: 'right'
            });
        }

        if (index === 2) {
            // Add Featured Icons
            sections.push({
                id: crypto.randomUUID(),
                type: 'features-icons',
                title: 'Why Choose Us',
                items: [
                    { icon: 'Zap', label: 'Lightning Fast' },
                    { icon: 'Shield', label: 'Secure' },
                    { icon: 'Smartphone', label: 'Mobile First' },
                    { icon: 'Globe', label: 'Global Scale' }
                ]
            });
        }

        if (index === 3) {
            // Add Stats
            sections.push({
                id: crypto.randomUUID(),
                type: 'stats',
                title: 'Our Impact',
                style: 'default',
                stats: [
                    { value: '10k+', label: 'Active Users', prefix: '', suffix: '' },
                    { value: '99', label: 'Uptime', prefix: '', suffix: '%' },
                    { value: '24/7', label: 'Support', prefix: '', suffix: '' }
                ]
            });
        }

        sections.push({
            id: crypto.randomUUID(),
            type,
            title: cat.name,
            categoryId: cat.databaseId,
            postCount,
            columns,
            showViewAll: true,
            showExcerpt: true,
            showDate: true,
            showAuthor: false,
        } as PostsSection);
    });

    return sections;
};

export default function InstallWizard() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(1);
    const [wpUrl, setWpUrl] = useState('');
    const [siteName, setSiteName] = useState('');
    const [calculatedSections, setCalculatedSections] = useState<HomepageSection[]>([]);
    const [adminUsername, setAdminUsername] = useState('');
    const [adminPassword, setAdminPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [connectionMessage, setConnectionMessage] = useState('');
    const [analysisData, setAnalysisData] = useState<{
        counts: { posts: number; pages: number; categories: number };
        categories: WPCategory[];
        hasElementor: boolean;
        elementorWarning?: string;
    } | null>(null);

    const steps = [
        { num: 1, label: 'Connect' },
        { num: 2, label: 'Analyze' },
        { num: 3, label: 'Account' },
        { num: 4, label: 'Ready' },
    ];

    const handleTestConnection = async () => {
        if (!wpUrl) return;

        setIsLoading(true);
        setConnectionStatus('idle');

        try {
            const result = await testWPConnection(wpUrl);

            if (result.success) {
                setConnectionStatus('success');
                setConnectionMessage('Connection successful! WPGraphQL is active.');
                if (result.siteName) {
                    setSiteName(result.siteName);
                }
            } else {
                setConnectionStatus('error');
                setConnectionMessage('Connection failed. Check URL and WPGraphQL plugin.');
            }
        } catch {
            setConnectionStatus('error');
            setConnectionMessage('Connection failed. Check URL and WPGraphQL plugin.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAnalyze = async () => {
        setIsLoading(true);

        try {
            const result = await analyzeWPSite(wpUrl);
            setAnalysisData(result);
            if (result.categories) {
                const defaults = generateDefaultSections(result.categories);
                setCalculatedSections(defaults);
            }
        } catch {
            // Handle error
        } finally {
            setIsLoading(false);
        }
    };

    const handleFinish = async () => {
        setIsLoading(true);

        try {
            await completeInstallation({
                wordpressUrl: wpUrl,
                siteName,
                homepageSections: calculatedSections,
                language: 'en', // Default, can be changed in settings later
                adminUser: {
                    username: adminUsername,
                    password: adminPassword,
                },
            });

            setCurrentStep(4);
        } catch {
            // Handle error
        } finally {
            setIsLoading(false);
        }
    };

    const handleNext = async () => {
        if (currentStep === 1 && connectionStatus === 'success') {
            await handleAnalyze();
        }

        if (currentStep === 3) {
            await handleFinish();
            return;
        }

        setCurrentStep(prev => Math.min(prev + 1, 4));
    };

    const canProceed = () => {
        switch (currentStep) {
            case 1: return connectionStatus === 'success';
            case 2: return !!analysisData;
            case 3: return !!adminUsername && !!adminPassword && adminPassword.length >= 6;
            default: return true;
        }
    };

    return (
        <div className={styles.installPage}>
            {/* Background gradient */}
            <div className={styles.bgGradient} />

            <div className={styles.installCard}>
                {/* Header */}
                <div className={styles.installHeader}>
                    <div className={styles.logoWrapper}>
                        <div className={styles.installLogo}>
                            <Globe size={24} />
                        </div>
                        <span className={styles.logoText}>Headless WP</span>
                    </div>
                </div>

                {/* Title */}
                <div className={styles.titleSection}>
                    <h1 className={styles.installTitle}>
                        {currentStep === 4 ? 'Setup Complete!' : 'Set up your site'}
                    </h1>
                    <p className={styles.installSubtitle}>
                        {currentStep === 4
                            ? 'Your Next.js + WordPress site is ready to use.'
                            : 'Connect your WordPress site and customize your frontend.'}
                    </p>
                </div>

                {/* Steps Progress */}
                {currentStep < 4 && (
                    <div className={styles.stepsProgress}>
                        {steps.slice(0, 3).map((step, index) => (
                            <div key={step.num} className={styles.stepItem}>
                                <div
                                    className={`${styles.stepCircle} ${currentStep > step.num
                                        ? styles.completed
                                        : currentStep === step.num
                                            ? styles.active
                                            : styles.inactive
                                        } `}
                                >
                                    {currentStep > step.num ? <Check size={14} /> : step.num}
                                </div>
                                <span className={`${styles.stepLabel} ${currentStep >= step.num ? styles.activeLabel : ''} `}>
                                    {step.label}
                                </span>
                                {index < 3 && (
                                    <div className={`${styles.stepConnector} ${currentStep > step.num ? styles.active : ''} `} />
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Step Content */}
                <div className={styles.stepContent} key={currentStep}>
                    {/* Step 1: Connect WordPress */}
                    {currentStep === 1 && (
                        <div className={styles.stepBody}>
                            <div className={styles.inputGroup}>
                                <label className={styles.inputLabel}>WordPress Site URL</label>
                                <div className={styles.urlInputWrapper}>
                                    <Globe size={18} className={styles.inputIcon} />
                                    <input
                                        type="url"
                                        className={styles.urlInput}
                                        placeholder="https://your-wordpress-site.com"
                                        value={wpUrl}
                                        onChange={(e) => setWpUrl(e.target.value)}
                                    />
                                </div>
                                <p className={styles.inputHint}>
                                    Make sure <a href="https://wordpress.org/plugins/wp-graphql/" target="_blank" rel="noopener noreferrer">WPGraphQL</a> plugin is installed and activated.
                                </p>
                            </div>

                            <button
                                className={styles.primaryButton}
                                onClick={handleTestConnection}
                                disabled={!wpUrl || isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className={styles.spinner} size={18} />
                                        Testing connection...
                                    </>
                                ) : (
                                    <>
                                        Test Connection
                                        <ArrowRight size={18} />
                                    </>
                                )}
                            </button>

                            {connectionStatus !== 'idle' && (
                                <div className={`${styles.statusMessage} ${connectionStatus === 'success' ? styles.success : styles.error} `}>
                                    {connectionStatus === 'success' ? <Check size={18} /> : <AlertTriangle size={18} />}
                                    <span>{connectionMessage}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 2: Analysis */}
                    {currentStep === 2 && (
                        <div className={styles.stepBody}>
                            {isLoading ? (
                                <div className={styles.loadingState}>
                                    <Loader2 className={styles.spinner} size={40} />
                                    <p>Analyzing your WordPress site...</p>
                                </div>
                            ) : analysisData ? (
                                <>
                                    <div className={styles.statsGrid}>
                                        <div className={styles.statCard}>
                                            <span className={styles.statNumber}>{analysisData.counts.posts}</span>
                                            <span className={styles.statLabel}>Posts</span>
                                        </div>
                                        <div className={styles.statCard}>
                                            <span className={styles.statNumber}>{analysisData.counts.pages}</span>
                                            <span className={styles.statLabel}>Pages</span>
                                        </div>
                                        <div className={styles.statCard}>
                                            <span className={styles.statNumber}>{analysisData.counts.categories}</span>
                                            <span className={styles.statLabel}>Categories</span>
                                        </div>
                                    </div>

                                    {analysisData.hasElementor && (
                                        <div className={styles.warningBox}>
                                            <AlertTriangle size={20} />
                                            <div>
                                                <strong>Elementor Detected</strong>
                                                <p>For best results, convert Elementor pages to Gutenberg blocks.</p>
                                            </div>
                                        </div>
                                    )}

                                    <div className={styles.siteInfoBox}>
                                        <span className={styles.siteInfoLabel}>Site Name</span>
                                        <span className={styles.siteInfoValue}>{siteName || 'Untitled'}</span>
                                    </div>
                                </>
                            ) : null}
                        </div>
                    )}



                    {/* Step 3: Admin Account */}
                    {currentStep === 3 && (
                        <div className={styles.stepBody}>
                            <div className={styles.inputGroup}>
                                <label className={styles.inputLabel}>Admin Username</label>
                                <div className={styles.urlInputWrapper}>
                                    <Lock size={18} className={styles.inputIcon} />
                                    <input
                                        type="text"
                                        className={styles.urlInput}
                                        placeholder="admin"
                                        value={adminUsername}
                                        onChange={(e) => setAdminUsername(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className={styles.inputGroup}>
                                <label className={styles.inputLabel}>Admin Password</label>
                                <div className={styles.urlInputWrapper}>
                                    <Lock size={18} className={styles.inputIcon} />
                                    <input
                                        type="password"
                                        className={styles.urlInput}
                                        placeholder="••••••••"
                                        value={adminPassword}
                                        onChange={(e) => setAdminPassword(e.target.value)}
                                    />
                                </div>
                                <p className={styles.inputHint}>
                                    Minimum 6 characters. You will use this to access the Manager.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Complete */}
                    {currentStep === 4 && (
                        <div className={styles.successScreen}>
                            <div className={styles.successIcon}>
                                <Zap size={32} />
                            </div>
                            <div className={styles.successMessage}>
                                <p>Your site <strong>{siteName}</strong> is now connected and ready.</p>
                                <p className={styles.successHint}>
                                    Logged in as <strong>{adminUsername}</strong>.
                                </p>
                            </div>
                            <div className={styles.successButtons}>
                                <button className={styles.primaryButton} onClick={() => router.push('/')}>
                                    View Site
                                    <ExternalLink size={18} />
                                </button>
                                <button className={styles.secondaryButton} onClick={() => router.push('/manager')}>
                                    <Palette size={18} />
                                    Open Manager
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Navigation */}
                {currentStep < 4 && currentStep > 1 && (
                    <div className={styles.stepNav}>
                        <button
                            className={styles.ghostButton}
                            onClick={() => setCurrentStep(prev => Math.max(prev - 1, 1))}
                        >
                            Back
                        </button>
                        <button
                            className={styles.primaryButton}
                            onClick={handleNext}
                            disabled={!canProceed() || isLoading}
                        >
                            {isLoading ? (
                                <Loader2 className={styles.spinner} size={18} />
                            ) : currentStep === 3 ? (
                                <>
                                    Complete Setup
                                    <Zap size={18} />
                                </>
                            ) : (
                                <>
                                    Continue
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </div>
                )}

                {currentStep === 1 && connectionStatus === 'success' && (
                    <div className={styles.stepNav}>
                        <div />
                        <button
                            className={styles.primaryButton}
                            onClick={handleNext}
                        >
                            Continue
                            <ArrowRight size={18} />
                        </button>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className={styles.installFooter}>
                <p>Powered by <strong>Next.js</strong> + <strong>WordPress</strong> | <a href="https://whspe.com" target="_blank" rel="noopener noreferrer">Whspe</a></p>
            </div>
        </div>
    );
}
