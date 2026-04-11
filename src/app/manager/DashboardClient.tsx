'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    LayoutDashboard,
    Settings,
    Home,
    Menu as MenuIcon,
    Palette,
    ExternalLink,
    FileText,
    FolderOpen,
    Plus,
    Trash2,
    GripVertical,
    Check,
    Loader2,
    RefreshCw,
    Globe,
    LogOut,
    X,
    Shield,
    HelpCircle,
    Megaphone,
    Languages,
    Download,
    AlertCircle,
    CheckCircle,
    MessageSquare,
    Puzzle,
} from 'lucide-react';
import { getConfig, updateSettings, logout, updateAdminCredentials, revalidateContent, analyzeWPSite, checkForAppUpdates, getAppVersion, performAppUpdate, rollbackAppUpdate, getUpdatePreflightCheck, hasUpdateBackup } from '@/lib/actions';
import { SiteConfig, MenuItem as MenuItemType, HomepageSection, ThemeColors, AdSlot } from '@/lib/config-types';
import { WPCategory } from '@/lib/wordpress';
import { supportedLanguages } from '@/lib/languages';
import SectionBuilder from '@/components/manager/SectionBuilder';
import PagesManager from '@/components/manager/PagesManager';
import HelpDocumentation from '@/components/manager/HelpDocumentation';
import styles from './manager.module.css';

type Tab = 'dashboard' | 'general' | 'homepage' | 'pages' | 'menus' | 'theme' | 'languages' | 'ads' | 'updates' | 'security' | 'help' | 'integrations';

const tabs = [
    { id: 'dashboard' as Tab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'general' as Tab, label: 'General', icon: Settings },
    { id: 'homepage' as Tab, label: 'Homepage', icon: Home },
    { id: 'pages' as Tab, label: 'Pages', icon: FileText },
    { id: 'menus' as Tab, label: 'Menus', icon: MenuIcon },
    { id: 'theme' as Tab, label: 'Theme', icon: Palette },
    { id: 'languages' as Tab, label: 'Languages', icon: Languages },
    { id: 'ads' as Tab, label: 'Ads', icon: Megaphone },
    { id: 'integrations' as Tab, label: 'Integrations', icon: Puzzle },
    { id: 'updates' as Tab, label: 'Updates', icon: Download },
    { id: 'security' as Tab, label: 'Security', icon: Shield },
    { id: 'help' as Tab, label: 'Help', icon: HelpCircle },
];

const defaultAdSlots: AdSlot[] = [
    { id: 'header_top', label: 'Header Top', location: 'Above the navigation menu', size: '728x90', active: false, code: '' },
    { id: 'home_hero_bottom', label: 'Homepage - Below Hero', location: 'Between hero and post lists', size: '728x90', active: false, code: '' },
    { id: 'sidebar_top', label: 'Sidebar Top', location: 'Top of the sidebar', size: '300x250', active: false, code: '' },
    { id: 'post_top', label: 'Post Top', location: 'Before post content', size: 'Responsive', active: false, code: '' },
    { id: 'post_content_1', label: 'Post Content (Middle)', location: 'Middle of post content', size: '300x250', active: false, code: '' },
    { id: 'post_bottom', label: 'Post Bottom', location: 'After post content', size: 'Responsive', active: false, code: '' },
    { id: 'footer_top', label: 'Footer Top', location: 'Above footer widgets', size: '728x90', active: false, code: '' },
];

export default function DashboardClient() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<Tab>('dashboard');
    const [config, setConfig] = useState<SiteConfig | null>(null);
    const [categories, setCategories] = useState<WPCategory[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [isClearingCache, setIsClearingCache] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [stats, setStats] = useState({ posts: 0, pages: 0, categories: 0 });

    // Update system states
    const [updateInfo, setUpdateInfo] = useState<{
        currentVersion: string;
        latestVersion: string;
        updateAvailable: boolean;
        releaseNotes?: string;
        isChecking: boolean;
        isUpdating: boolean;
        isRollingBack: boolean;
        canRollback: boolean;
        preflightIssues: string[];
        preflightWarnings: string[];
        error?: string;
    }>({
        currentVersion: '1.0.0',
        latestVersion: '1.0.0',
        updateAvailable: false,
        isChecking: false,
        isUpdating: false,
        isRollingBack: false,
        canRollback: false,
        preflightIssues: [],
        preflightWarnings: [],
    });

    // Form states
    const [siteName, setSiteName] = useState('');
    const [logoUrl, setLogoUrl] = useState('');
    const [colors, setColors] = useState<ThemeColors | undefined>(undefined);
    const [headerCta, setHeaderCta] = useState<{ text: string; url: string } | undefined>(undefined);
    const [gaId, setGaId] = useState('');

    // ... (diğer state'ler aynı kalıyor)

    // loadConfig içindeki checkUpdates çağrısı aynı kalabilir ama checkUpdates fonksiyonunun kendisini aşağıda güncelleyeceğiz.

    // ... (loadConfig ve handleSync fonksiyonları)

    const checkUpdates = async () => {
        setUpdateInfo(prev => ({ ...prev, isChecking: true, error: undefined }));
        try {
            const [versionInfo, updateCheck, hasBackup, preflight] = await Promise.all([
                getAppVersion(),
                checkForAppUpdates(),
                hasUpdateBackup(),
                getUpdatePreflightCheck()
            ]);

            setUpdateInfo({
                currentVersion: versionInfo.version,
                latestVersion: updateCheck.latestVersion,
                updateAvailable: updateCheck.updateAvailable,
                releaseNotes: updateCheck.releaseInfo?.body,
                isChecking: false,
                isUpdating: false,
                isRollingBack: false,
                canRollback: hasBackup,
                preflightIssues: preflight.issues,
                preflightWarnings: preflight.warnings,
                error: updateCheck.error
            });
        } catch (error) {
            setUpdateInfo(prev => ({
                ...prev,
                isChecking: false,
                error: 'Failed to check for updates'
            }));
        }
    };

    const handleUpdate = async () => {
        // Pre-flight check
        if (updateInfo.preflightIssues.length > 0) {
            alert('Cannot update due to issues:\n' + updateInfo.preflightIssues.join('\n'));
            return;
        }

        if (updateInfo.preflightWarnings.length > 0) {
            if (!confirm('Warnings detected:\n' + updateInfo.preflightWarnings.join('\n') + '\n\nDo you still want to proceed?')) {
                return;
            }
        }

        if (!confirm('Are you sure you want to update? This will backup your configuration and install the latest version.')) {
            return;
        }

        setUpdateInfo(prev => ({ ...prev, isUpdating: true, error: undefined }));
        try {
            const result = await performAppUpdate();
            if (result.success) {
                alert('Update completed! Please restart the application.');
                window.location.reload();
            } else {
                setUpdateInfo(prev => ({
                    ...prev,
                    isUpdating: false,
                    error: result.error || 'Update failed'
                }));
            }
        } catch (error) {
            setUpdateInfo(prev => ({
                ...prev,
                isUpdating: false,
                error: 'Update failed'
            }));
        }
    };

    const handleRollback = async () => {
        if (!confirm('Are you serious? This will rollback the application to the previous version from the latest backup.')) {
            return;
        }

        setUpdateInfo(prev => ({ ...prev, isRollingBack: true, error: undefined }));
        try {
            const result = await rollbackAppUpdate();
            if (result.success) {
                alert('Rollback completed! Please restart the application.');
                window.location.reload();
            } else {
                setUpdateInfo(prev => ({
                    ...prev,
                    isRollingBack: false,
                    error: result.error || 'Rollback failed'
                }));
            }
        } catch (error) {
            setUpdateInfo(prev => ({
                ...prev,
                isRollingBack: false,
                error: 'Rollback failed'
            }));
        }
    };
    const [ads, setAds] = useState<AdSlot[]>([]);
    const [language, setLanguage] = useState('en');
    const [primaryMenu, setPrimaryMenu] = useState<MenuItemType[]>([]);
    const [footerMenu, setFooterMenu] = useState<MenuItemType[]>([]);
    const [homepageSections, setHomepageSections] = useState<HomepageSection[]>([]);
    const [topBar, setTopBar] = useState({ enabled: true, statusText: '', statusLinkText: '', statusLinkUrl: '' });
    const [socialLinks, setSocialLinks] = useState<{ platform: string; url: string }[]>([]);
    const [seo, setSeo] = useState({
        homepageTitle: '',
        homepageDescription: '',
        urlStructure: 'category-slug',
        categoryBase: 'category',
        tagBase: 'tag'
    });
    const [codeInjection, setCodeInjection] = useState({ head: '', body: '' });
    const [postSettings, setPostSettings] = useState({
        relatedPosts: { enabled: true, title: 'Related Posts', count: 3 }
    });
    const [uiStrings, setUiStrings] = useState({
        readMore: 'Read More',
        relatedPosts: 'Related Posts',
        latestPosts: 'Latest Posts',
        categories: 'Categories',
        tags: 'Tags',
        share: 'Share',
        search: 'Search',
        searchPlaceholder: 'Search posts...',
        noResults: 'No results found',
        loadMore: 'Load More',
        readingTime: 'min read',
        author: 'Author'
    });

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        setIsLoading(true);
        try {
            const cfg = await getConfig();
            setConfig(cfg);
            setSiteName(cfg.siteName);
            setLogoUrl(cfg.logoUrl);
            setColors(cfg.colors);
            setLanguage(cfg.language);
            setGaId(cfg.gaId || '');
            setAds(cfg.ads || defaultAdSlots);
            setPrimaryMenu(cfg.menus.primary || []);
            setFooterMenu(cfg.menus.footer || []);
            setHomepageSections(cfg.homepageSections || []);
            setTopBar(cfg.topBar || { enabled: true, statusText: '✨ New features available!', statusLinkText: 'Learn More', statusLinkUrl: '/about' });
            setSocialLinks(cfg.socialLinks || []);
            setSeo({
                homepageTitle: cfg.seo?.homepageTitle || '',
                homepageDescription: cfg.seo?.homepageDescription || '',
                urlStructure: cfg.seo?.urlStructure || '/%postname%/',
                categoryBase: cfg.seo?.categoryBase || 'category',
                tagBase: cfg.seo?.tagBase || 'tag'
            });
            setCodeInjection({
                head: cfg.codeInjection?.head || '',
                body: cfg.codeInjection?.body || ''
            });
            const relatedPostsSettings = cfg.postSettings?.relatedPosts || { enabled: true, title: 'Related Posts', count: 3 };
            setPostSettings({
                relatedPosts: {
                    enabled: relatedPostsSettings.enabled,
                    title: relatedPostsSettings.title || 'Related Posts',
                    count: relatedPostsSettings.count || 3
                }
            });
            setHeaderCta(cfg.headerCta);
            if (cfg.uiStrings) {
                setUiStrings({
                    readMore: cfg.uiStrings.readMore || 'Read More',
                    relatedPosts: cfg.uiStrings.relatedPosts || 'Related Posts',
                    latestPosts: cfg.uiStrings.latestPosts || 'Latest Posts',
                    categories: cfg.uiStrings.categories || 'Categories',
                    tags: cfg.uiStrings.tags || 'Tags',
                    share: cfg.uiStrings.share || 'Share',
                    search: cfg.uiStrings.search || 'Search',
                    searchPlaceholder: cfg.uiStrings.searchPlaceholder || 'Search posts...',
                    noResults: cfg.uiStrings.noResults || 'No results found',
                    loadMore: cfg.uiStrings.loadMore || 'Load More',
                    readingTime: cfg.uiStrings.readingTime || 'min read',
                    author: cfg.uiStrings.author || 'Author'
                });
            }

            // Fetch site stats if URL is configured
            if (cfg.wordpressUrl) {
                const results = await analyzeWPSite(cfg.wordpressUrl);
                if (results.success) {
                    setStats(results.counts);
                    setCategories(results.categories);
                }
            }

            // Check for updates
            checkUpdates();
        } catch (error) {
            console.error('Failed to load config:', error);
        } finally {
            setIsLoading(false);
        }
    };



    const handleSync = async () => {
        setIsSyncing(true);
        try {
            if (config?.wordpressUrl) {
                const results = await analyzeWPSite(config.wordpressUrl);
                if (results.success) {
                    setStats(results.counts);
                    setCategories(results.categories);
                    setShowToast(true);
                    setTimeout(() => setShowToast(false), 3000);
                }
            }
        } catch (error) {
            console.error('Sync failed:', error);
        } finally {
            setIsSyncing(false);
        }
    };

    const handleClearCache = async () => {
        setIsClearingCache(true);
        try {
            await revalidateContent();
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
        } catch (error) {
            console.error('Failed to clear cache:', error);
        } finally {
            setIsClearingCache(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updateSettings({
                siteName,
                logoUrl,
                ...(colors && { colors }),
                language,
                gaId: gaId || undefined,
                homepageSections,
                ads,
                topBar,
                headerCta,
                socialLinks: socialLinks as { platform: 'facebook' | 'twitter' | 'instagram' | 'youtube' | 'linkedin' | 'tiktok'; url: string }[],
                seo: {
                    homepageTitle: seo.homepageTitle,
                    homepageDescription: seo.homepageDescription,
                    urlStructure: seo.urlStructure,
                    categoryBase: seo.categoryBase,
                    tagBase: seo.tagBase,
                },
                codeInjection,
                postSettings,
                uiStrings,
                menus: {
                    primary: primaryMenu,
                    footer: footerMenu,
                },
            });
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
        } catch (error) {
            console.error('Save failed:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleLogout = async () => {
        await logout();
        router.push('/manager/login');
    };

    const addMenuItem = () => {
        setPrimaryMenu([...primaryMenu, { label: '', url: '', id: Date.now().toString() }]);
    };

    const updateMenuItem = (index: number, field: 'label' | 'url', value: string) => {
        const updated = [...primaryMenu];
        updated[index] = { ...updated[index], [field]: value };
        setPrimaryMenu(updated);
    };

    const removeMenuItem = (index: number) => {
        setPrimaryMenu(primaryMenu.filter((_, i) => i !== index));
    };

    const addSubMenuItem = (parentIndex: number) => {
        const updated = [...primaryMenu];
        if (!updated[parentIndex].children) {
            updated[parentIndex].children = [];
        }
        updated[parentIndex].children!.push({ label: '', url: '', id: Date.now().toString() });
        setPrimaryMenu(updated);
    };

    const updateSubMenuItem = (parentIndex: number, childIndex: number, field: 'label' | 'url', value: string) => {
        const updated = [...primaryMenu];
        if (updated[parentIndex].children) {
            updated[parentIndex].children![childIndex] = {
                ...updated[parentIndex].children![childIndex],
                [field]: value
            };
            setPrimaryMenu(updated);
        }
    };

    const removeSubMenuItem = (parentIndex: number, childIndex: number) => {
        const updated = [...primaryMenu];
        if (updated[parentIndex].children) {
            updated[parentIndex].children = updated[parentIndex].children!.filter((_, i) => i !== childIndex);
            setPrimaryMenu(updated);
        }
    };

    // Footer Menu Helpers
    const addFooterMenuItem = () => {
        setFooterMenu([...footerMenu, { label: '', url: '', id: Date.now().toString() }]);
    };

    const updateFooterMenuItem = (index: number, field: 'label' | 'url', value: string) => {
        const updated = [...footerMenu];
        updated[index] = { ...updated[index], [field]: value };
        setFooterMenu(updated);
    };

    const removeFooterMenuItem = (index: number) => {
        setFooterMenu(footerMenu.filter((_, i) => i !== index));
    };

    if (isLoading) {
        return (
            <div className={styles.managerPage} style={{ alignItems: 'center', justifyContent: 'center' }}>
                <Loader2 size={40} className="spinner" />
            </div>
        );
    }

    // Show installation warning if not installed
    if (!config?.installed || !config?.wordpressUrl) {
        return (
            <div className={styles.managerPage} style={{ alignItems: 'center', justifyContent: 'center' }}>
                <div className={styles.notInstalledWarning}>
                    <div className={styles.warningIcon}>
                        <Globe size={48} strokeWidth={1} />
                    </div>
                    <h2>Installation Required</h2>
                    <p>You need to complete the installation before accessing the manager dashboard.</p>
                    <p className={styles.warningHint}>Connect your WordPress site to get started.</p>
                    <Link href="/install" className={styles.installButton}>
                        Go to Installation
                        <ExternalLink size={16} />
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.managerPage}>
            {/* Sidebar */}
            <aside className={styles.sidebar}>
                <div className={styles.sidebarHeader}>
                    <div className={styles.sidebarLogo}>
                        <Globe size={18} />
                    </div>
                    <div>
                        <div className={styles.sidebarTitle}>Headless WP</div>
                        <div className={styles.sidebarSubtitle}>Manager</div>
                    </div>
                </div>

                <nav className={styles.nav}>
                    <ul className={styles.navList}>
                        {tabs.map((tab) => (
                            <li
                                key={tab.id}
                                className={`${styles.navItem} ${activeTab === tab.id ? styles.active : ''}`}
                                onClick={() => setActiveTab(tab.id)}
                            >
                                <tab.icon size={18} />
                                {tab.label}
                            </li>
                        ))}
                    </ul>
                </nav>

                <div className={styles.sidebarFooter}>
                    <Link href="/" className={styles.viewSiteLink}>
                        <ExternalLink size={16} />
                        View Site
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <main className={styles.mainContent}>
                {/* Header */}
                <header className={styles.header}>
                    <h1 className={styles.pageTitle}>
                        {tabs.find((t) => t.id === activeTab)?.label}
                    </h1>
                    <div className={styles.headerActions}>
                        <div className={`${styles.statusIndicator} ${config?.wordpressUrl ? styles.connected : styles.disconnected}`}>
                            <span className={styles.statusDot} />
                            {config?.wordpressUrl ? 'Connected' : 'Disconnected'}
                        </div>
                        <button onClick={handleLogout} className={styles.headerLogoutButton} title="Logout">
                            <LogOut size={18} />
                        </button>
                    </div>
                </header>

                {/* Content Area */}
                <div className={styles.contentArea}>
                    {/* Dashboard Tab */}
                    {activeTab === 'dashboard' && (
                        <>
                            {/* Environment Warning */}
                            {typeof window !== 'undefined' && 
                             (window.location.hostname.includes('vercel.app') || 
                              window.location.hostname.includes('netlify.app')) && (
                                <div className={styles.envWarningCard}>
                                    <AlertCircle size={20} />
                                    <div>
                                        <p className={styles.envWarningTitle}>Read-Only Environment Detected</p>
                                        <p className={styles.envWarningDesc}>
                                            Changes made here are saved to <code>site-config.json</code> but will be lost on the next deployment. 
                                            To make changes permanent, run this project locally, copy the 
                                            generated <code>site-config.json</code>, and commit it to your repository.
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className={styles.statsGrid}>
                                <div className={styles.statCard}>
                                    <div className={styles.statIcon}>
                                        <FileText size={24} />
                                    </div>
                                    <div className={styles.statInfo}>
                                        <div className={styles.statValue}>{stats.posts}</div>
                                        <div className={styles.statLabel}>Total Posts</div>
                                    </div>
                                </div>
                                <div className={styles.statCard}>
                                    <div className={styles.statIcon}>
                                        <FileText size={24} />
                                    </div>
                                    <div className={styles.statInfo}>
                                        <div className={styles.statValue}>{stats.pages}</div>
                                        <div className={styles.statLabel}>Total Pages</div>
                                    </div>
                                </div>
                                <div className={styles.statCard}>
                                    <div className={styles.statIcon}>
                                        <FolderOpen size={24} />
                                    </div>
                                    <div className={styles.statInfo}>
                                        <div className={styles.statValue}>{stats.categories}</div>
                                        <div className={styles.statLabel}>Categories</div>
                                    </div>
                                </div>
                                <div className={styles.statCard}>
                                    <div className={styles.statIcon}>
                                        <RefreshCw size={24} />
                                    </div>
                                    <div className={styles.statInfo}>
                                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                            <button
                                                className="btn btn-sm btn-outline"
                                                onClick={handleSync}
                                                disabled={isSyncing}
                                                style={{ flex: 1, whiteSpace: 'nowrap' }}
                                            >
                                                {isSyncing ? <Loader2 size={14} className="spinner" /> : 'Sync'}
                                            </button>
                                            <button
                                                className="btn btn-sm btn-outline"
                                                onClick={handleClearCache}
                                                disabled={isClearingCache}
                                                style={{ flex: 1, whiteSpace: 'nowrap' }}
                                                title="Clear Cache"
                                            >
                                                {isClearingCache ? <Loader2 size={14} className="spinner" /> : 'Cache'}
                                            </button>
                                        </div>
                                        <div className={styles.statLabel} style={{ marginTop: '0.25rem' }}>Actions</div>
                                    </div>
                                </div>
                            </div>

                            <div className={styles.settingsSection}>
                                <div className={styles.sectionHeader}>
                                    <h2 className={styles.sectionTitle}>Quick Info</h2>
                                </div>
                                <div className={styles.sectionContent}>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                                        <div style={{ background: 'var(--manager-bg)', padding: '1rem', borderRadius: '6px', border: '1px solid var(--manager-border)' }}>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--manager-muted)', marginBottom: '0.25rem' }}>WordPress URL</div>
                                            <div style={{ fontWeight: 500, wordBreak: 'break-all' }}>
                                                <a href={config?.wordpressUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--manager-accent)', textDecoration: 'none' }}>
                                                    {config?.wordpressUrl || 'Not configured'}
                                                </a>
                                            </div>
                                        </div>
                                        <div style={{ background: 'var(--manager-bg)', padding: '1rem', borderRadius: '6px', border: '1px solid var(--manager-border)' }}>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--manager-muted)', marginBottom: '0.25rem' }}>Site Name</div>
                                            <div style={{ fontWeight: 500 }}>{config?.siteName || 'Not configured'}</div>
                                        </div>
                                        <div style={{ background: 'var(--manager-bg)', padding: '1rem', borderRadius: '6px', border: '1px solid var(--manager-border)' }}>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--manager-muted)', marginBottom: '0.25rem' }}>Active Language</div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <span>{supportedLanguages.find(l => l.code === language)?.flag}</span>
                                                <span style={{ fontWeight: 500 }}>{supportedLanguages.find(l => l.code === language)?.name}</span>
                                            </div>
                                        </div>
                                        <div style={{ background: 'var(--manager-bg)', padding: '1rem', borderRadius: '6px', border: '1px solid var(--manager-border)' }}>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--manager-muted)', marginBottom: '0.25rem' }}>Homepage Configuration</div>
                                            <div style={{ fontWeight: 500 }}>{homepageSections.length} Sections Active</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* General Tab */}
                    {activeTab === 'general' && (
                        <>
                            <div className={styles.settingsSection}>
                                <div className={styles.sectionHeader}>
                                    <h2 className={styles.sectionTitle}>General Settings</h2>
                                </div>
                                <div className={styles.sectionContent}>
                                    <div className={styles.formRow}>
                                        <div className={styles.formGroup}>
                                            <label className="label">Site Name</label>
                                            <input
                                                type="text"
                                                className="input"
                                                value={siteName}
                                                onChange={(e) => setSiteName(e.target.value)}
                                                placeholder="My Awesome Site"
                                            />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label className="label">Logo</label>
                                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                                {logoUrl && (
                                                    <div style={{ width: 48, height: 48, flexShrink: 0, position: 'relative', border: '1px solid var(--manager-border)', borderRadius: 6, overflow: 'hidden', background: '#fff' }}>
                                                        <img src={logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                                    </div>
                                                )}
                                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        className="input"
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) {
                                                                const reader = new FileReader();
                                                                reader.onloadend = () => {
                                                                    setLogoUrl(reader.result as string);
                                                                };
                                                                reader.readAsDataURL(file);
                                                            }
                                                        }}
                                                        style={{ padding: '0.4rem' }}
                                                    />
                                                    <input
                                                        type="text"
                                                        className="input"
                                                        value={logoUrl}
                                                        onChange={(e) => setLogoUrl(e.target.value)}
                                                        placeholder="Or enter logo URL..."
                                                        style={{ fontSize: '0.8rem' }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className={styles.settingsSection}>
                                <div className={styles.sectionHeader}>
                                    <h2 className={styles.sectionTitle}>Cache Management</h2>
                                </div>
                                <div className={styles.sectionContent}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div>
                                            <p style={{ fontWeight: 500, marginBottom: '0.25rem' }}>Clear Application Cache</p>
                                            <p style={{ fontSize: '0.85rem', color: 'var(--manager-muted)' }}>
                                                Revalidate all static pages and fetched data. Use this if your changes aren't showing up.
                                            </p>
                                        </div>
                                        <button
                                            className="btn btn-outline"
                                            onClick={handleClearCache}
                                            disabled={isClearingCache}
                                            style={{ minWidth: '140px' }}
                                        >
                                            {isClearingCache ? <Loader2 size={16} className="spinner" /> : <RefreshCw size={16} />}
                                            Clear Cache
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className={styles.settingsSection}>
                                <div className={styles.sectionHeader}>
                                    <h2 className={styles.sectionTitle}>Analytics</h2>
                                </div>
                                <div className={styles.sectionContent}>
                                    <div className={styles.formRow}>
                                        <div className={styles.formGroup}>
                                            <label className="label">Google Analytics ID (G-XXXXXXX)</label>
                                            <input
                                                type="text"
                                                className="input"
                                                value={gaId}
                                                onChange={(e) => setGaId(e.target.value)}
                                                placeholder="G-XXXXXXXXXX"
                                            />
                                            <p className={styles.helperText} style={{ marginTop: '0.5rem', color: 'var(--manager-muted)', fontSize: '0.8rem' }}>
                                                Enter your Measurement ID to enable Google Analytics 4.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className={styles.settingsSection}>
                                <div className={styles.sectionHeader}>
                                    <h2 className={styles.sectionTitle}>Top Bar Settings</h2>
                                </div>
                                <div className={styles.sectionContent}>
                                    <div className={styles.formRow}>
                                        <div className={styles.formGroup} style={{ flexDirection: 'row', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                                            <input
                                                type="checkbox"
                                                id="topBarEnabled"
                                                style={{ width: 'auto', margin: 0 }}
                                                checked={topBar.enabled !== false}
                                                onChange={(e) => setTopBar({ ...topBar, enabled: e.target.checked })}
                                            />
                                            <label htmlFor="topBarEnabled" className="label" style={{ margin: 0, cursor: 'pointer' }}>Show Top Bar</label>
                                        </div>
                                    </div>
                                    {topBar.enabled !== false && (
                                        <div className={styles.formRow}>
                                            <div className={styles.formGroup}>
                                                <label className="label">Status Text</label>
                                                <input
                                                    type="text"
                                                    className="input"
                                                    value={topBar.statusText}
                                                    onChange={(e) => setTopBar({ ...topBar, statusText: e.target.value })}
                                                    placeholder="✨ New features available!"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className={styles.settingsSection}>
                                <div className={styles.sectionHeader}>
                                    <h2 className={styles.sectionTitle}>Header CTA Button</h2>
                                </div>
                                <div className={styles.sectionContent}>
                                    <div className={styles.formRow}>
                                        <div className={styles.formGroup}>
                                            <label className="label">Button Text</label>
                                            <input
                                                type="text"
                                                className="input"
                                                value={headerCta?.text || ''}
                                                onChange={(e) => setHeaderCta(prev => ({ text: e.target.value, url: prev?.url || '' }))}
                                                placeholder="e.g. Start Now"
                                            />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label className="label">Button URL</label>
                                            <input
                                                type="text"
                                                className="input"
                                                value={headerCta?.url || ''}
                                                onChange={(e) => setHeaderCta(prev => ({ text: prev?.text || '', url: e.target.value }))}
                                                placeholder="https://..."
                                            />
                                        </div>
                                    </div>
                                    <p className={styles.helperText} style={{ marginTop: '0.5rem', color: 'var(--manager-muted)', fontSize: '0.8rem' }}>
                                        Leave empty to hide the button.
                                    </p>
                                    <p className={styles.helperText} style={{ marginTop: '0.5rem', color: 'var(--manager-muted)', fontSize: '0.85rem' }}>
                                        Leave empty to hide the button.
                                    </p>
                                </div>
                            </div>



                            <div className={styles.settingsSection}>
                                <div className={styles.sectionHeader}>
                                    <h2 className={styles.sectionTitle}>SEO & Code Injection</h2>
                                </div>
                                <div className={styles.sectionContent}>
                                    {/* Homepage SEO */}
                                    <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--manager-foreground)' }}>Homepage SEO</h3>
                                    <div className={styles.formRow}>
                                        <div className={styles.formGroup}>
                                            <label className="label">Meta Title</label>
                                            <input
                                                type="text"
                                                className="input"
                                                value={seo.homepageTitle}
                                                onChange={(e) => setSeo({ ...seo, homepageTitle: e.target.value })}
                                                placeholder="My Awesome Site - The Best WP Site"
                                            />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label className="label">Meta Description</label>
                                            <textarea
                                                className="input"
                                                value={seo.homepageDescription}
                                                onChange={(e) => setSeo({ ...seo, homepageDescription: e.target.value })}
                                                rows={3}
                                                placeholder="A brief description of your site for search engines."
                                            />
                                        </div>
                                    </div>

                                    <h3 style={{ fontSize: '1rem', fontWeight: 600, marginTop: '1.5rem', marginBottom: '1rem', color: 'var(--manager-foreground)' }}>URL Settings</h3>
                                    <div className={styles.formGroup}>
                                        <label className="label">Permalink Structure</label>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                            {/* Post name */}
                                            <label
                                                style={{ display: 'flex', alignItems: 'flex-start', cursor: 'pointer' }}
                                                onClick={() => setSeo({ ...seo, urlStructure: '/%postname%/' })}
                                            >
                                                <input
                                                    type="radio"
                                                    name="urlStructure"
                                                    checked={seo.urlStructure === '/%postname%/' || seo.urlStructure === 'simple-slug'}
                                                    readOnly
                                                    style={{ marginTop: '0.25rem' }}
                                                />
                                                <div>
                                                    <div style={{ fontWeight: 500 }}>Post name</div>
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--manager-muted)' }}>https://example.com/sample-post/</div>
                                                </div>
                                            </label>

                                            {/* Day and name */}
                                            <label
                                                style={{ display: 'flex', alignItems: 'flex-start', cursor: 'pointer' }}
                                                onClick={() => setSeo({ ...seo, urlStructure: '/%year%/%monthnum%/%day%/%postname%/' })}
                                            >
                                                <input
                                                    type="radio"
                                                    name="urlStructure"
                                                    checked={seo.urlStructure === '/%year%/%monthnum%/%day%/%postname%/'}
                                                    readOnly
                                                    style={{ marginTop: '0.25rem' }}
                                                />
                                                <div>
                                                    <div style={{ fontWeight: 500 }}>Day and name</div>
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--manager-muted)' }}>https://example.com/2024/01/03/sample-post/</div>
                                                </div>
                                            </label>

                                            {/* Custom */}
                                            <label
                                                style={{ display: 'flex', alignItems: 'flex-start', cursor: 'pointer' }}
                                                onClick={() => {
                                                    if (!seo.urlStructure.includes('%')) {
                                                        setSeo({ ...seo, urlStructure: '/blog/%postname%/' });
                                                    }
                                                }}
                                            >
                                                <input
                                                    type="radio"
                                                    name="urlStructure"
                                                    checked={!['/%postname%/', '/%year%/%monthnum%/%day%/%postname%/', 'simple-slug', 'category-slug'].includes(seo.urlStructure)}
                                                    readOnly
                                                    style={{ marginTop: '0.25rem' }}
                                                />
                                                <div>
                                                    <div style={{ fontWeight: 500 }}>Custom Structure</div>
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--manager-muted)' }}>Enter your custom structure below</div>
                                                </div>
                                            </label>

                                            {/* Custom Input */}
                                            {!['/%postname%/', '/%year%/%monthnum%/%day%/%postname%/', 'simple-slug', 'category-slug'].includes(seo.urlStructure) && (
                                                <div style={{ paddingLeft: '1.5rem', marginTop: '-0.25rem' }}>
                                                    <input
                                                        type="text"
                                                        className="input"
                                                        value={seo.urlStructure}
                                                        onChange={(e) => setSeo({ ...seo, urlStructure: e.target.value })}
                                                        placeholder="/blog/%postname%/"
                                                    />
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--manager-muted)', marginTop: '0.25rem' }}>Available tags: %postname%, %post_id%, %year%, %monthnum%, %day%</div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Optional Base Settings */}
                                    <div style={{ marginTop: '1.5rem', marginBottom: '1rem' }}>
                                        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--manager-foreground)', marginBottom: '0.75rem' }}>Optional</div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                            <div className={styles.formGroup}>
                                                <label className="label">Category Base</label>
                                                <input
                                                    type="text"
                                                    className="input"
                                                    value={seo.categoryBase}
                                                    onChange={(e) => setSeo({ ...seo, categoryBase: e.target.value })}
                                                    placeholder="category"
                                                />
                                            </div>
                                            <div className={styles.formGroup}>
                                                <label className="label">Tag Base</label>
                                                <input
                                                    type="text"
                                                    className="input"
                                                    value={seo.tagBase}
                                                    onChange={(e) => setSeo({ ...seo, tagBase: e.target.value })}
                                                    placeholder="tag"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Code Injection */}
                                    <h3 style={{ fontSize: '1rem', fontWeight: 600, marginTop: '1.5rem', marginBottom: '1rem', color: 'var(--manager-foreground)' }}>Custom Scripts</h3>
                                    <div className={styles.formRow}>
                                        <div className={styles.formGroup}>
                                            <label className="label">Head Code (Analytics, GTM etc.)</label>
                                            <textarea
                                                className="input"
                                                value={codeInjection.head}
                                                onChange={(e) => setCodeInjection({ ...codeInjection, head: e.target.value })}
                                                rows={4}
                                                placeholder="<script>...</script>"
                                                style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}
                                            />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label className="label">Body Top Code (NoScript etc.)</label>
                                            <textarea
                                                className="input"
                                                value={codeInjection.body}
                                                onChange={(e) => setCodeInjection({ ...codeInjection, body: e.target.value })}
                                                rows={4}
                                                placeholder="<noscript>...</noscript>"
                                                style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}
                                            />
                                        </div>
                                    </div>

                                    {/* Post Settings */}
                                    <h3 style={{ fontSize: '1rem', fontWeight: 600, marginTop: '2rem', marginBottom: '1rem', color: 'var(--manager-foreground)' }}>Post Settings</h3>
                                    <div className={styles.formRow}>
                                        <div className={styles.formGroup} style={{ flexGrow: 1 }}>
                                            <label className="label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={postSettings.relatedPosts.enabled}
                                                    onChange={(e) => setPostSettings({ ...postSettings, relatedPosts: { ...postSettings.relatedPosts, enabled: e.target.checked } })}
                                                />
                                                Enable Related Posts
                                            </label>
                                            <p style={{ fontSize: '0.8rem', color: 'var(--manager-muted)', marginTop: '0.25rem' }}>
                                                Show related posts at the bottom of the article.
                                            </p>
                                        </div>
                                    </div>
                                    {postSettings.relatedPosts.enabled && (
                                        <div className={styles.formRow}>
                                            <div className={styles.formGroup}>
                                                <label className="label">Section Title</label>
                                                <input
                                                    type="text"
                                                    className="input"
                                                    value={postSettings.relatedPosts.title}
                                                    onChange={(e) => setPostSettings({ ...postSettings, relatedPosts: { ...postSettings.relatedPosts, title: e.target.value } })}
                                                />
                                            </div>
                                            <div className={styles.formGroup}>
                                                <label className="label">Post Count</label>
                                                <select
                                                    className="input"
                                                    value={postSettings.relatedPosts.count}
                                                    onChange={(e) => setPostSettings({ ...postSettings, relatedPosts: { ...postSettings.relatedPosts, count: parseInt(e.target.value) } })}
                                                >
                                                    <option value={2}>2 Posts</option>
                                                    <option value={3}>3 Posts (Grid)</option>
                                                    <option value={4}>4 Posts</option>
                                                    <option value={6}>6 Posts</option>
                                                </select>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className={styles.settingsSection}>
                                <div className={styles.sectionHeader}>
                                    <h2 className={styles.sectionTitle}>Social Media Links</h2>
                                </div>
                                <div className={styles.sectionContent}>
                                    <div className={styles.menuList}>
                                        {socialLinks.map((link, index) => (
                                            <div key={index} className={styles.menuItem}>
                                                <div className={styles.menuItemInputs}>
                                                    <select
                                                        className="input"
                                                        value={link.platform}
                                                        onChange={(e) => {
                                                            const updated = [...socialLinks];
                                                            updated[index].platform = e.target.value;
                                                            setSocialLinks(updated);
                                                        }}
                                                    >
                                                        <option value="twitter">Twitter / X</option>
                                                        <option value="facebook">Facebook</option>
                                                        <option value="instagram">Instagram</option>
                                                        <option value="youtube">YouTube</option>
                                                        <option value="linkedin">LinkedIn</option>
                                                        <option value="tiktok">TikTok</option>
                                                    </select>
                                                    <input
                                                        type="url"
                                                        className="input"
                                                        placeholder="https://..."
                                                        value={link.url}
                                                        onChange={(e) => {
                                                            const updated = [...socialLinks];
                                                            updated[index].url = e.target.value;
                                                            setSocialLinks(updated);
                                                        }}
                                                    />
                                                </div>
                                                <button
                                                    className={styles.menuItemDelete}
                                                    onClick={() => {
                                                        setSocialLinks(socialLinks.filter((_, i) => i !== index));
                                                    }}
                                                    aria-label="Remove link"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <button
                                        className={styles.addMenuItem}
                                        onClick={() => setSocialLinks([...socialLinks, { platform: 'twitter', url: '' }])}
                                    >
                                        <Plus size={16} />
                                        Add Social Link
                                    </button>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Homepage Tab - NEW SECTION BUILDER */}
                    {activeTab === 'homepage' && (
                        <div className={styles.settingsSection}>
                            <div className={styles.sectionHeader}>
                                <h2 className={styles.sectionTitle}>Homepage Sections</h2>
                            </div>
                            <div className={styles.sectionContent}>
                                <SectionBuilder
                                    sections={homepageSections}
                                    onChange={setHomepageSections}
                                    categories={categories}
                                />
                            </div>
                        </div>
                    )}

                    {/* Menus Tab */}
                    {activeTab === 'menus' && (
                        <>
                            <div className={styles.settingsSection}>
                                <div className={styles.sectionHeader}>
                                    <h2 className={styles.sectionTitle}>Primary Menu</h2>
                                </div>
                                <div className={styles.sectionContent}>
                                    <div className={styles.menuList}>
                                        {primaryMenu.map((item, index) => (
                                            <div key={item.id || index} style={{ marginBottom: '0.75rem', border: '1px solid var(--manager-border)', borderRadius: '6px', background: 'var(--manager-bg)' }}>
                                                <div className={styles.menuItem} style={{ border: 'none', marginBottom: 0 }}>
                                                    <GripVertical size={18} className={styles.menuItemDrag} />
                                                    <div className={styles.menuItemInputs}>
                                                        <input
                                                            type="text"
                                                            className="input"
                                                            placeholder="Label"
                                                            value={item.label}
                                                            onChange={(e) => updateMenuItem(index, 'label', e.target.value)}
                                                        />
                                                        <input
                                                            type="text"
                                                            className="input"
                                                            placeholder="URL"
                                                            value={item.url}
                                                            onChange={(e) => updateMenuItem(index, 'url', e.target.value)}
                                                        />
                                                    </div>
                                                    <Trash2
                                                        size={18}
                                                        className={styles.menuItemDelete}
                                                        onClick={() => removeMenuItem(index)}
                                                    />
                                                </div>

                                                <div style={{ padding: '0 1rem 1rem 2.5rem' }}>
                                                    {item.children?.map((child, cIndex) => (
                                                        <div key={child.id || cIndex} className={styles.menuItem} style={{ marginBottom: '0.5rem', background: 'var(--background)' }}>
                                                            <div className={styles.menuItemInputs}>
                                                                <input
                                                                    type="text"
                                                                    className="input"
                                                                    placeholder="Sub Label"
                                                                    value={child.label}
                                                                    onChange={(e) => updateSubMenuItem(index, cIndex, 'label', e.target.value)}
                                                                    style={{ fontSize: '0.9rem', padding: '0.4rem 0.75rem' }}
                                                                />
                                                                <input
                                                                    type="text"
                                                                    className="input"
                                                                    placeholder="Sub URL"
                                                                    value={child.url}
                                                                    onChange={(e) => updateSubMenuItem(index, cIndex, 'url', e.target.value)}
                                                                    style={{ fontSize: '0.9rem', padding: '0.4rem 0.75rem' }}
                                                                />
                                                            </div>
                                                            <Trash2
                                                                size={16}
                                                                className={styles.menuItemDelete}
                                                                onClick={() => removeSubMenuItem(index, cIndex)}
                                                            />
                                                        </div>
                                                    ))}
                                                    <button
                                                        className={styles.addMenuItem}
                                                        style={{ width: 'auto', padding: '0.4rem 0.75rem', fontSize: '0.8rem', marginTop: '0.25rem' }}
                                                        onClick={() => addSubMenuItem(index)}
                                                    >
                                                        <Plus size={14} />
                                                        Add Sub Link
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <button className={styles.addMenuItem} onClick={addMenuItem}>
                                        <Plus size={18} />
                                        Add Menu Item
                                    </button>
                                </div>
                            </div>

                            <div className={styles.settingsSection} style={{ marginTop: '2rem' }}>
                                <div className={styles.sectionHeader}>
                                    <h2 className={styles.sectionTitle}>Footer Menu</h2>
                                    <p className="hint">Links for privacy policy, terms, etc.</p>
                                </div>
                                <div className={styles.sectionContent}>
                                    <div className={styles.menuList}>
                                        {footerMenu.map((item, index) => (
                                            <div key={item.id || index} className={styles.menuItem}>
                                                <GripVertical size={18} className={styles.menuItemDrag} />
                                                <div className={styles.menuItemInputs}>
                                                    <input
                                                        type="text"
                                                        className="input"
                                                        placeholder="Label"
                                                        value={item.label}
                                                        onChange={(e) => updateFooterMenuItem(index, 'label', e.target.value)}
                                                    />
                                                    <input
                                                        type="text"
                                                        className="input"
                                                        placeholder="URL"
                                                        value={item.url}
                                                        onChange={(e) => updateFooterMenuItem(index, 'url', e.target.value)}
                                                    />
                                                </div>
                                                <Trash2
                                                    size={18}
                                                    className={styles.menuItemDelete}
                                                    onClick={() => removeFooterMenuItem(index)}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                    <button className={styles.addMenuItem} onClick={addFooterMenuItem}>
                                        <Plus size={18} />
                                        Add Menu Item
                                    </button>
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab === 'theme' && colors && (
                        <div className={styles.settingsSection}>
                            <div className={styles.sectionHeader}>
                                <h2 className={styles.sectionTitle}>Customize Colors</h2>
                                <p className="hint">Click on the color box to pick a new color.</p>
                            </div>
                            <div className={styles.sectionContent}>
                                <div className={styles.formRow} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
                                    {(Object.keys(colors) as Array<keyof ThemeColors>).map((key) => (
                                        <div key={key} className={styles.formGroup}>
                                            <label className="label" style={{ textTransform: 'capitalize' }}>
                                                {key.replace(/([A-Z])/g, ' $1').trim()}
                                            </label>
                                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                <input
                                                    type="color"
                                                    value={colors[key] as string}
                                                    onChange={(e) => setColors({ ...colors, [key]: e.target.value })}
                                                    style={{ width: '40px', height: '40px', padding: '0', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                                />
                                                <input
                                                    type="text"
                                                    className="input"
                                                    value={colors[key] as string}
                                                    onChange={(e) => setColors({ ...colors, [key]: e.target.value })}
                                                    style={{ flex: 1 }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Languages Tab */}
                    {activeTab === 'languages' && (
                        <div className={styles.settingsSection}>
                            <div className={styles.sectionHeader}>
                                <h2 className={styles.sectionTitle}>Site Language & Localization</h2>
                                <p className="hint">Configure your site language and customize UI text strings.</p>
                            </div>
                            <div className={styles.sectionContent}>
                                <div className={styles.formRow}>
                                    <div className={styles.formGroup}>
                                        <label className="label">Site Language (HTML lang attribute & hreflang)</label>
                                        <select
                                            className="input"
                                            value={language}
                                            onChange={(e) => setLanguage(e.target.value)}
                                        >
                                            {supportedLanguages.map((lang) => (
                                                <option key={lang.code} value={lang.code}>
                                                    {lang.flag} {lang.name} ({lang.nativeName})
                                                </option>
                                            ))}
                                        </select>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--manager-muted)', marginTop: '0.5rem' }}>
                                            This sets the HTML lang attribute and is used for SEO hreflang tags.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'languages' && (
                        <div className={styles.settingsSection} style={{ marginTop: '1.5rem' }}>
                            <div className={styles.sectionHeader}>
                                <h2 className={styles.sectionTitle}>UI Text Strings</h2>
                                <p className="hint">Customize the text displayed across your website.</p>
                            </div>
                            <div className={styles.sectionContent}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                                    <div className={styles.formGroup}>
                                        <label className="label">Read More</label>
                                        <input
                                            type="text"
                                            className="input"
                                            value={uiStrings.readMore}
                                            onChange={(e) => setUiStrings({ ...uiStrings, readMore: e.target.value })}
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label className="label">Related Posts</label>
                                        <input
                                            type="text"
                                            className="input"
                                            value={uiStrings.relatedPosts}
                                            onChange={(e) => setUiStrings({ ...uiStrings, relatedPosts: e.target.value })}
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label className="label">Latest Posts</label>
                                        <input
                                            type="text"
                                            className="input"
                                            value={uiStrings.latestPosts}
                                            onChange={(e) => setUiStrings({ ...uiStrings, latestPosts: e.target.value })}
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label className="label">Categories</label>
                                        <input
                                            type="text"
                                            className="input"
                                            value={uiStrings.categories}
                                            onChange={(e) => setUiStrings({ ...uiStrings, categories: e.target.value })}
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label className="label">Tags</label>
                                        <input
                                            type="text"
                                            className="input"
                                            value={uiStrings.tags}
                                            onChange={(e) => setUiStrings({ ...uiStrings, tags: e.target.value })}
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label className="label">Share</label>
                                        <input
                                            type="text"
                                            className="input"
                                            value={uiStrings.share}
                                            onChange={(e) => setUiStrings({ ...uiStrings, share: e.target.value })}
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label className="label">Search</label>
                                        <input
                                            type="text"
                                            className="input"
                                            value={uiStrings.search}
                                            onChange={(e) => setUiStrings({ ...uiStrings, search: e.target.value })}
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label className="label">Search Placeholder</label>
                                        <input
                                            type="text"
                                            className="input"
                                            value={uiStrings.searchPlaceholder}
                                            onChange={(e) => setUiStrings({ ...uiStrings, searchPlaceholder: e.target.value })}
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label className="label">No Results</label>
                                        <input
                                            type="text"
                                            className="input"
                                            value={uiStrings.noResults}
                                            onChange={(e) => setUiStrings({ ...uiStrings, noResults: e.target.value })}
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label className="label">Load More</label>
                                        <input
                                            type="text"
                                            className="input"
                                            value={uiStrings.loadMore}
                                            onChange={(e) => setUiStrings({ ...uiStrings, loadMore: e.target.value })}
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label className="label">Reading Time (suffix)</label>
                                        <input
                                            type="text"
                                            className="input"
                                            value={uiStrings.readingTime}
                                            onChange={(e) => setUiStrings({ ...uiStrings, readingTime: e.target.value })}
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label className="label">Author</label>
                                        <input
                                            type="text"
                                            className="input"
                                            value={uiStrings.author}
                                            onChange={(e) => setUiStrings({ ...uiStrings, author: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Pages Tab */}
                    {activeTab === 'pages' && (
                        <PagesManager onSave={() => {
                            setShowToast(true);
                            setTimeout(() => setShowToast(false), 3000);
                        }} />
                    )}

                    {/* Security Tab */}
                    {activeTab === 'security' && (
                        <SecurityTab />
                    )}

                    {/* Help Tab */}
                    {activeTab === 'help' && (
                        <div className={styles.settingsSection}>
                            <div className={styles.sectionHeader}>
                                <h2 className={styles.sectionTitle}>Help & Support</h2>
                            </div>
                            <div className={styles.sectionContent}>
                                <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>

                                    {/* Documentation Card */}
                                    <div style={{ padding: '2rem', border: '1px solid var(--manager-border)', borderRadius: '12px', background: 'var(--manager-card)', display: 'flex', flexDirection: 'column', height: '100%' }}>
                                        <div style={{ marginBottom: '1.5rem', color: 'var(--manager-foreground)' }}>
                                            <FileText size={32} />
                                        </div>
                                        <h3 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--manager-foreground)' }}>
                                            Documentation
                                        </h3>
                                        <p style={{ color: 'var(--manager-muted)', marginBottom: '2rem', lineHeight: 1.6, flex: 1 }}>
                                            Need help setting up or customizing your site? Check out our comprehensive installation guide and detailed documentation.
                                        </p>
                                        <a
                                            href="https://www.whspe.com/install"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={styles.installButton}
                                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', justifyContent: 'center' }}
                                        >
                                            View Documentation
                                            <ExternalLink size={16} />
                                        </a>
                                    </div>

                                    {/* GitHub Card */}
                                    <div style={{ padding: '2rem', border: '1px solid var(--manager-border)', borderRadius: '12px', background: 'var(--manager-card)', display: 'flex', flexDirection: 'column', height: '100%' }}>
                                        <div style={{ marginBottom: '1.5rem', color: 'var(--manager-foreground)' }}>
                                            <svg height="32" width="32" viewBox="0 0 16 16" fill="currentColor">
                                                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
                                            </svg>
                                        </div>
                                        <h3 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--manager-foreground)' }}>
                                            GitHub Repository
                                        </h3>
                                        <p style={{ color: 'var(--manager-muted)', marginBottom: '2rem', lineHeight: 1.6, flex: 1 }}>
                                            Explore the source code, report issues, or contribute to the open-source project on GitHub.
                                        </p>
                                        <a
                                            href="https://github.com/Turkeyseo/headless-wordpress"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={styles.installButton}
                                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', background: '#24292e', borderColor: '#24292e', justifyContent: 'center' }}
                                        >
                                            View on GitHub
                                            <ExternalLink size={16} />
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Ads Management Tab */}
                {activeTab === 'ads' && (
                    <div className={styles.settingsSection}>
                        <div className={styles.sectionHeader}>
                            <h2 className={styles.sectionTitle}>Ad Slots</h2>
                            <p className={styles.sectionDescription}>
                                Manage advertisement codes. All slots are disabled by default.
                                Enable a slot and paste your ad code (Google AdSense, etc.) to display ads.
                            </p>
                        </div>
                        <div className={styles.sectionContent}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                {ads.map((slot, index) => (
                                    <div key={slot.id} style={{
                                        background: 'var(--manager-bg)',
                                        padding: '1.25rem',
                                        borderRadius: '8px',
                                        border: '1px solid var(--manager-border)'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--manager-foreground)' }}>{slot.label}</div>
                                                <div style={{ fontSize: '0.85rem', color: 'var(--manager-muted)', marginTop: '0.25rem' }}>
                                                    Location: {slot.location} • Recommended Size: {slot.size}
                                                </div>
                                            </div>
                                            <div className={styles.formGroup} style={{ flexDirection: 'row', alignItems: 'center', gap: '0.75rem', margin: 0 }}>
                                                <label className="label" style={{ margin: 0, cursor: 'pointer', fontSize: '0.9rem' }}>
                                                    {slot.active ? 'Active' : 'Inactive'}
                                                </label>
                                                <div
                                                    style={{
                                                        width: 40,
                                                        height: 20,
                                                        borderRadius: 20,
                                                        background: slot.active ? 'var(--manager-accent)' : 'var(--manager-border)',
                                                        position: 'relative',
                                                        cursor: 'pointer',
                                                        transition: 'background 0.2s'
                                                    }}
                                                    onClick={() => {
                                                        const newAds = [...ads];
                                                        newAds[index] = { ...slot, active: !slot.active };
                                                        setAds(newAds);
                                                    }}
                                                >
                                                    <div style={{
                                                        width: 16,
                                                        height: 16,
                                                        borderRadius: '50%',
                                                        background: '#fff',
                                                        position: 'absolute',
                                                        top: 2,
                                                        left: slot.active ? 22 : 2,
                                                        transition: 'left 0.2s',
                                                        boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                                                    }} />
                                                </div>
                                            </div>
                                        </div>

                                        {slot.active && (
                                            <div className={styles.formGroup} style={{ marginTop: '0.5rem' }}>
                                                <label className="label">Ad Code (HTML/Script)</label>
                                                <textarea
                                                    className="input"
                                                    value={slot.code}
                                                    onChange={(e) => {
                                                        const newAds = [...ads];
                                                        newAds[index] = { ...slot, code: e.target.value };
                                                        setAds(newAds);
                                                    }}
                                                    rows={4}
                                                    placeholder="<script>...</script>"
                                                    style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Updates Tab */}
                {activeTab === 'updates' && (
                    <>
                        <div className={styles.settingsSection}>
                            <div className={styles.sectionHeader}>
                                <h2 className={styles.sectionTitle}>System Update</h2>
                                <button
                                    className="btn btn-sm btn-outline"
                                    onClick={checkUpdates}
                                    disabled={updateInfo.isChecking}
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                >
                                    {updateInfo.isChecking ? (
                                        <Loader2 size={14} className="spinner" />
                                    ) : (
                                        <RefreshCw size={14} />
                                    )}
                                    Check for Updates
                                </button>
                            </div>
                            <div className={styles.sectionContent}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                                    <div style={{ background: 'var(--manager-bg)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--manager-border)' }}>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--manager-muted)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current Version</div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>v{updateInfo.currentVersion}</div>
                                    </div>
                                    <div style={{ background: 'var(--manager-bg)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--manager-border)' }}>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--manager-muted)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Latest Version</div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            v{updateInfo.latestVersion}
                                            {updateInfo.updateAvailable && (
                                                <span style={{ fontSize: '0.75rem', background: 'rgba(0, 212, 123, 0.1)', color: 'var(--manager-success)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                                                    New!
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div style={{ background: 'var(--manager-bg)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--manager-border)' }}>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--manager-muted)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            {updateInfo.updateAvailable ? (
                                                <>
                                                    <AlertCircle size={18} style={{ color: 'var(--manager-warning)' }} />
                                                    <span style={{ fontWeight: 500, color: 'var(--manager-warning)' }}>Update Available</span>
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle size={18} style={{ color: 'var(--manager-success)' }} />
                                                    <span style={{ fontWeight: 500, color: 'var(--manager-success)' }}>Up to Date</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {updateInfo.error && (
                                    <div style={{ background: 'rgba(255, 77, 77, 0.1)', border: '1px solid rgba(255, 77, 77, 0.2)', borderRadius: '8px', padding: '1rem', marginBottom: '1rem', color: 'var(--manager-error)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500 }}>
                                            <AlertCircle size={16} />
                                            {updateInfo.error}
                                        </div>
                                    </div>
                                )}

                                {updateInfo.updateAvailable && (
                                    <div style={{ background: 'rgba(0, 112, 243, 0.05)', border: '1px solid rgba(0, 112, 243, 0.2)', borderRadius: '8px', padding: '1.5rem' }}>
                                        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>
                                            Update to v{updateInfo.latestVersion}
                                        </h3>

                                        {updateInfo.releaseNotes && (
                                            <div style={{ marginBottom: '1rem' }}>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--manager-muted)', marginBottom: '0.5rem' }}>Release Notes:</div>
                                                <div style={{ background: 'var(--manager-bg)', padding: '1rem', borderRadius: '6px', fontSize: '0.85rem', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                                                    {updateInfo.releaseNotes}
                                                </div>
                                            </div>
                                        )}

                                        <div style={{ background: 'rgba(245, 166, 35, 0.1)', border: '1px solid rgba(245, 166, 35, 0.2)', borderRadius: '6px', padding: '0.75rem', marginBottom: '1rem', fontSize: '0.85rem' }}>
                                            <strong>Note:</strong> Your site configuration (settings, menus, etc.) will be preserved during the update.
                                        </div>

                                        <button
                                            className="btn btn-primary"
                                            onClick={handleUpdate}
                                            disabled={updateInfo.isUpdating}
                                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                        >
                                            {updateInfo.isUpdating ? (
                                                <>
                                                    <Loader2 size={16} className="spinner" />
                                                    Updating...
                                                </>
                                            ) : (
                                                <>
                                                    <Download size={16} />
                                                    Install Update
                                                </>
                                            )}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Preflight Checks */}
                        {updateInfo.updateAvailable && (updateInfo.preflightIssues.length > 0 || updateInfo.preflightWarnings.length > 0) && (
                            <div style={{ marginBottom: '1.5rem', background: 'rgba(245, 166, 35, 0.05)', border: '1px solid rgba(245, 166, 35, 0.2)', borderRadius: '8px', overflow: 'hidden' }}>
                                <div style={{ padding: '0.75rem 1rem', background: 'rgba(245, 166, 35, 0.1)', borderBottom: '1px solid rgba(245, 166, 35, 0.2)', fontSize: '0.875rem', fontWeight: 600, color: 'var(--manager-warning)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <AlertCircle size={16} />
                                    Update Check
                                </div>
                                <div style={{ padding: '1rem' }}>
                                    {updateInfo.preflightIssues.map((issue, i) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--manager-error)' }}>
                                            <span style={{ marginTop: '0.2rem', width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor', flexShrink: 0 }} />
                                            {issue}
                                        </div>
                                    ))}
                                    {updateInfo.preflightWarnings.map((warning, i) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--manager-warning)' }}>
                                            <span style={{ marginTop: '0.2rem', width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor', flexShrink: 0 }} />
                                            {warning}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}


                        {/* Rollback Option */}
                        {updateInfo.canRollback && (
                            <div className={styles.settingsSection}>
                                <div className={styles.sectionHeader} style={{ background: 'rgba(245, 166, 35, 0.05)', borderBottom: '1px solid rgba(245, 166, 35, 0.1)' }}>
                                    <h2 className={styles.sectionTitle} style={{ color: 'var(--manager-warning)' }}>Emergency Recovery</h2>
                                </div>
                                <div className={styles.sectionContent}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                                        <div>
                                            <div style={{ fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Restore Previous Version</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--manager-muted)' }}>
                                                Something went wrong? You can rollback to the previous version. Your data is safe.
                                            </div>
                                        </div>
                                        <button
                                            className="btn btn-sm btn-outline"
                                            onClick={handleRollback}
                                            disabled={updateInfo.isRollingBack}
                                            style={{ borderColor: 'var(--manager-warning)', color: 'var(--manager-warning)' }}
                                        >
                                            {updateInfo.isRollingBack ? (
                                                <>
                                                    <Loader2 size={14} className="spinner" />
                                                    Restoring...
                                                </>
                                            ) : (
                                                <>
                                                    <RefreshCw size={14} style={{ transform: 'rotate(-90deg)' }} />
                                                    Rollback
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className={styles.settingsSection}>
                            <div className={styles.sectionHeader}>
                                <h2 className={styles.sectionTitle}>About</h2>
                            </div>
                            <div className={styles.sectionContent}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: 'var(--manager-muted)' }}>Application</span>
                                        <span>Headless WordPress</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: 'var(--manager-muted)' }}>Version</span>
                                        <span>v{updateInfo.currentVersion}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: 'var(--manager-muted)' }}>Repository</span>
                                        <a href="https://github.com/Turkeyseo/headless-wordpress" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--manager-accent)' }}>
                                            GitHub
                                        </a>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: 'var(--manager-muted)' }}>License</span>
                                        <span>MIT</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* Help Tab */}
                {activeTab === 'help' && <HelpDocumentation config={config} />}

                {/* Legacy Help Tab (Disabled) */}
                {false && activeTab === 'help' && (
                    <div className={styles.settingsSection}>
                        <div className={styles.sectionHeader}>
                            <h2 className={styles.sectionTitle}>Help & Documentation</h2>
                        </div>
                        <div className={styles.sectionContent}>
                            <div className={styles.helpBlock}>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>Compatible Plugins</h3>
                                <p style={{ color: 'var(--manager-muted)', marginBottom: '1.5rem' }}>To get the most out of your headless setup, we recommend using the following plugins:</p>

                                <div style={{ marginBottom: '1.5rem', padding: '1.5rem', border: '1px solid var(--manager-border)', borderRadius: '8px', background: 'var(--manager-bg)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                                        <FileText size={20} className="text-blue-500" />
                                        <h4 style={{ fontWeight: 600, fontSize: '1rem' }}>Contact Form 7</h4>
                                    </div>
                                    <p style={{ fontSize: '0.9rem', color: 'var(--manager-muted)', marginBottom: '1rem' }}>
                                        Create forms in WordPress and use them in your headless site.
                                    </p>
                                    <div style={{ background: 'var(--manager-bg-alt)', padding: '1rem', borderRadius: '6px', fontSize: '0.9rem', border: '1px solid var(--manager-border)' }}>
                                        <strong style={{ display: 'block', marginBottom: '0.5rem' }}>Integration Guide:</strong>
                                        <ol style={{ paddingLeft: '1.25rem', margin: '0', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            <li>Create a form in WordPress Admin (Contact &gt; Contact Forms).</li>
                                            <li>Locate the <strong>ID</strong> in the shortcode. Example: <code>[contact-form-7 id="123" ...]</code> means ID is <strong>123</strong>.</li>
                                            <li>Use the standard form component in your pages or the dedicated Contact Form section (coming soon).</li>
                                        </ol>
                                        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--manager-border)' }}>
                                            <code style={{ background: 'var(--manager-bg)', padding: '0.2rem 0.4rem', borderRadius: '4px', fontSize: '0.85rem' }}>&lt;ContactForm7 formId="123" /&gt;</code> component is available for developers.
                                        </div>
                                    </div>
                                </div>

                                <div style={{ padding: '1.5rem', border: '1px solid var(--manager-border)', borderRadius: '8px', background: 'var(--manager-bg)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                                        <MessageSquare size={20} className="text-green-500" />
                                        <h4 style={{ fontWeight: 600, fontSize: '1rem' }}>WordPress Comments</h4>
                                    </div>
                                    <p style={{ fontSize: '0.9rem', color: 'var(--manager-muted)', marginBottom: '1rem' }}>
                                        Full support for native WordPress commenting system.
                                    </p>
                                    <div style={{ background: 'var(--manager-bg-alt)', padding: '1rem', borderRadius: '6px', fontSize: '0.9rem', border: '1px solid var(--manager-border)' }}>
                                        <p style={{ margin: 0 }}>
                                            Comments on your blog posts are automatically fetched from WordPress.
                                            When a visitor leaves a comment on this headless site, it is sent to your WordPress dashboard for moderation (unless you allow anonymous comments).
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}


                {/* Integrations Tab */}
                {activeTab === 'integrations' && (
                    <div className={styles.settingsSection}>
                        <div className={styles.sectionHeader}>
                            <h2 className={styles.sectionTitle}>Plugin Integrations</h2>
                            <p style={{ color: 'var(--manager-muted)' }}>Enhance your headless site with popular WordPress plugins.</p>
                        </div>
                        <div className={styles.sectionContent}>

                            {/* Contact Form 7 Integration */}
                            <div style={{ marginBottom: '1.5rem', padding: '1.5rem', border: '1px solid var(--manager-border)', borderRadius: '8px', background: 'var(--manager-bg)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{ background: '#3b82f6', color: 'white', padding: '0.6rem', borderRadius: '6px', fontWeight: 'bold' }}>
                                            <FileText size={20} />
                                        </div>
                                        <div>
                                            <h4 style={{ fontWeight: 600, fontSize: '1rem', margin: 0 }}>Contact Form 7</h4>
                                            <p style={{ fontSize: '0.85rem', color: 'var(--manager-muted)', margin: '0.25rem 0 0 0' }}>Enable Contact Form 7 support.</p>
                                        </div>
                                    </div>
                                    <label className={styles.switch}>
                                        <input
                                            type="checkbox"
                                            checked={config?.plugins?.contactForm7?.enabled || false}
                                            onChange={(e) => {
                                                const currentPlugins = config?.plugins || {};
                                                setConfig({
                                                    ...config!,
                                                    plugins: {
                                                        ...currentPlugins,
                                                        contactForm7: { enabled: e.target.checked }
                                                    }
                                                });
                                            }}
                                        />
                                        <span className={styles.slider}></span>
                                    </label>
                                </div>
                            </div>

                            {/* Comments Integration */}
                            <div style={{ marginBottom: '1.5rem', padding: '1.5rem', border: '1px solid var(--manager-border)', borderRadius: '8px', background: 'var(--manager-bg)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{ background: '#16a34a', color: 'white', padding: '0.6rem', borderRadius: '6px', fontWeight: 'bold' }}>
                                            <MessageSquare size={20} />
                                        </div>
                                        <div>
                                            <h4 style={{ fontWeight: 600, fontSize: '1rem', margin: 0 }}>WordPress Comments</h4>
                                            <p style={{ fontSize: '0.85rem', color: 'var(--manager-muted)', margin: '0.25rem 0 0 0' }}>Enable native comments on blog posts.</p>
                                        </div>
                                    </div>
                                    <label className={styles.switch}>
                                        <input
                                            type="checkbox"
                                            checked={config?.plugins?.comments?.enabled || false}
                                            onChange={(e) => {
                                                const currentPlugins = config?.plugins || {};
                                                setConfig({
                                                    ...config!,
                                                    plugins: {
                                                        ...currentPlugins,
                                                        comments: { enabled: e.target.checked }
                                                    }
                                                });
                                            }}
                                        />
                                        <span className={styles.slider}></span>
                                    </label>
                                </div>
                            </div>

                            {/* ACF Integration */}
                            <div style={{ marginBottom: '1.5rem', padding: '1.5rem', border: '1px solid var(--manager-border)', borderRadius: '8px', background: 'var(--manager-bg)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{ background: '#2271b1', color: 'white', padding: '0.6rem', borderRadius: '6px', fontWeight: 'bold' }}>ACF</div>
                                        <div>
                                            <h4 style={{ fontWeight: 600, fontSize: '1rem', margin: 0 }}>Advanced Custom Fields</h4>
                                            <p style={{ fontSize: '0.85rem', color: 'var(--manager-muted)', margin: '0.25rem 0 0 0' }}>Display custom fields automatically.</p>
                                        </div>
                                    </div>
                                    <label className={styles.switch}>
                                        <input
                                            type="checkbox"
                                            checked={config?.plugins?.acf?.enabled || false}
                                            onChange={(e) => {
                                                const currentPlugins = config?.plugins || {};
                                                const currentAcf = currentPlugins.acf || { enabled: false, showInFrontend: true };
                                                setConfig({
                                                    ...config!,
                                                    plugins: {
                                                        ...currentPlugins,
                                                        acf: { ...currentAcf, enabled: e.target.checked, showInFrontend: true }
                                                    }
                                                });
                                            }}
                                        />
                                        <span className={styles.slider}></span>
                                    </label>
                                </div>
                                {config?.plugins?.acf?.enabled && (
                                    <div style={{ background: 'var(--manager-bg-alt)', padding: '1rem', borderRadius: '6px', fontSize: '0.9rem', border: '1px solid var(--manager-border)' }}>
                                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', color: '#16a34a' }}>
                                            <CheckCircle size={16} />
                                            <span>Active: Custom fields will be fetched via REST API and displayed on post details.</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* SEO Integration */}
                            <div style={{ padding: '1.5rem', border: '1px solid var(--manager-border)', borderRadius: '8px', background: 'var(--manager-bg)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{ background: '#a4286a', color: 'white', padding: '0.6rem', borderRadius: '6px', fontWeight: 'bold' }}>SEO</div>
                                        <div>
                                            <h4 style={{ fontWeight: 600, fontSize: '1rem', margin: 0 }}>Advanced SEO</h4>
                                            <p style={{ fontSize: '0.85rem', color: 'var(--manager-muted)', margin: '0.25rem 0 0 0' }}>Yoast SEO or RankMath integration.</p>
                                        </div>
                                    </div>
                                    <label className={styles.switch}>
                                        <input
                                            type="checkbox"
                                            checked={config?.plugins?.seo?.enabled || false}
                                            onChange={(e) => {
                                                const currentPlugins = config?.plugins || {};
                                                const currentSeo = currentPlugins.seo || { enabled: false, provider: 'default' };
                                                setConfig({
                                                    ...config!,
                                                    plugins: {
                                                        ...currentPlugins,
                                                        seo: { ...currentSeo, enabled: e.target.checked }
                                                    }
                                                });
                                            }}
                                        />
                                        <span className={styles.slider}></span>
                                    </label>
                                </div>
                                {config?.plugins?.seo?.enabled && (
                                    <div style={{ background: 'var(--manager-bg-alt)', padding: '1rem', borderRadius: '6px', fontSize: '0.9rem', border: '1px solid var(--manager-border)' }}>
                                        <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                                            <label className="label">SEO Provider Plugin</label>
                                            <select
                                                className="input"
                                                value={config?.plugins?.seo?.provider || 'default'}
                                                onChange={(e) => {
                                                    const currentPlugins = config?.plugins || {};
                                                    const currentSeo = currentPlugins.seo || { enabled: true, provider: 'default' };
                                                    setConfig({
                                                        ...config!,
                                                        plugins: {
                                                            ...currentPlugins,
                                                            seo: { ...currentSeo, provider: e.target.value as any }
                                                        }
                                                    });
                                                }}
                                            >
                                                <option value="default">Default / None</option>
                                                <option value="yoast">Yoast SEO</option>
                                                <option value="rankmath">Rank Math (Recommended)</option>
                                            </select>
                                            <p className="hint" style={{ marginTop: '0.5rem' }}>Select which plugin handles your metadata in WordPress.</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                        </div>
                    </div>
                )}

                {/* Security Tab */}
                {activeTab === 'security' && <SecurityTab />}

                {activeTab !== 'dashboard' && activeTab !== 'updates' && activeTab !== 'help' && activeTab !== 'security' && (
                    <div className={styles.saveBar}>
                        <button className="btn btn-primary" onClick={handleSave} disabled={isSaving}>
                            {isSaving ? (
                                <>
                                    <Loader2 size={16} className="spinner" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Check size={16} />
                                    Save Changes
                                </>
                            )}
                        </button>
                    </div>
                )}
            </main>

            {/* Toast */}
            {showToast && (
                <div className={styles.toastSuccess}>
                    <Check size={18} />
                    Changes saved successfully!
                </div>
            )}
        </div>
    );
}

function SecurityTab() {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        confirmPassword: ''
    });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [config, setConfig] = useState<SiteConfig | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        getConfig().then(cfg => {
            setConfig(cfg);
            setFormData(prev => ({ ...prev, username: cfg.auth?.username || '' }));
        });
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (formData.password && formData.password !== formData.confirmPassword) {
            setMessage({ type: 'error', text: 'Passwords do not match' });
            return;
        }

        setIsLoading(true);
        try {
            const result = await updateAdminCredentials({
                username: formData.username,
                password: formData.password || undefined // Only send if set
            });

            if (result.success) {
                setMessage({ type: 'success', text: result.message });
                setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
            } else {
                setMessage({ type: 'error', text: result.message });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'An unexpected error occurred' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.settingsSection}>
            <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Admin Credentials</h2>
                <p className="hint">Update your login username and password.</p>
            </div>
            <div className={styles.sectionContent}>
                <form onSubmit={handleSubmit} style={{ maxWidth: '500px' }}>
                    <div className={styles.formGroup}>
                        <label className="label">Username</label>
                        <input
                            type="text"
                            className="input"
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            required
                        />
                    </div>

                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label className="label">New Password</label>
                            <input
                                type="password"
                                className="input"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                placeholder="Leave empty to keep current"
                                minLength={6}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label className="label">Confirm Password</label>
                            <input
                                type="password"
                                className="input"
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                placeholder="Confirm new password"
                            />
                        </div>
                    </div>

                    {message && (
                        <div style={{
                            padding: '0.75rem',
                            borderRadius: '6px',
                            marginTop: '1rem',
                            fontSize: '0.9rem',
                            backgroundColor: message.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            color: message.type === 'success' ? '#10b981' : '#ef4444',
                            border: `1px solid ${message.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
                        }}>
                            {message.text}
                        </div>
                    )}

                    <div style={{ marginTop: '1.5rem' }}>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={isLoading}
                        >
                            {isLoading ? <Loader2 size={16} className="spinner" /> : <Shield size={16} />}
                            Update Credentials
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
