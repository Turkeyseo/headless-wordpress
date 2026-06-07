'use server';

import { updateSiteConfig, getSiteConfig, SiteConfig, MenuItem, HomepageSection } from './config';
import { testConnection, checkForElementor, getSiteCounts, getCategories, WPCategory, createComment, submitContactForm7, WPComment, CF7InvalidField } from './wordpress';
import { revalidatePath } from 'next/cache';
import {
    hashPassword,
    verifyPassword,
    generateSessionSecret,
    setSessionCookie,
    clearSessionCookie,
    getSessionUser,
    isManagerAuthenticated,
} from './auth';

// Test WordPress connection
export async function testWPConnection(url: string): Promise<{
    success: boolean;
    message: string;
    siteName?: string;
}> {
    const result = await testConnection(url);

    return {
        success: result.success,
        message: result.message,
        siteName: result.siteInfo?.generalSettings?.title,
    };
}

// Analyze WordPress site
export async function analyzeWPSite(url: string): Promise<{
    success: boolean;
    counts: { posts: number; pages: number; categories: number };
    categories: WPCategory[];
    hasElementor: boolean;
    elementorWarning?: string;
}> {
    try {
        const [counts, categories, elementorCheck] = await Promise.all([
            getSiteCounts(url),
            getCategories(url),
            checkForElementor(url),
        ]);

        return {
            success: true,
            counts,
            categories,
            hasElementor: elementorCheck.hasElementor,
            elementorWarning: elementorCheck.warning,
        };
    } catch {
        return {
            success: false,
            counts: { posts: 0, pages: 0, categories: 0 },
            categories: [],
            hasElementor: false,
        };
    }
}

// Complete installation
export async function completeInstallation(data: {
    wordpressUrl: string;
    siteName: string;

    language: string;
    adminUser?: {
        username: string;
        password: string;
    };
    homepageSections?: HomepageSection[];
}): Promise<{ success: boolean; message: string }> {
    try {
        // Re-install guard: once a site is installed and protected by an admin
        // account, only an authenticated manager may re-run installation.
        const existing = getSiteConfig();
        if (existing.installed && existing.auth) {
            const user = await getSessionUser();
            if (!user) {
                return { success: false, message: 'Site already installed' };
            }
        }

        // Auto-generate primary menu from top categories
        let primaryMenu: MenuItem[] = [];
        try {
            const categories = await getCategories(data.wordpressUrl);
            const topCategories = categories
                .filter(c => (c.count || 0) > 0)
                .sort((a, b) => (b.count || 0) - (a.count || 0))
                .slice(0, 5);

            primaryMenu = topCategories.map(cat => ({
                id: `cat-${cat.databaseId}`,
                label: cat.name,
                url: `/category/${cat.slug}`,
            }));
        } catch (e) {
            console.error('Failed to generate default menu:', e);
        }

        const configUpdate: Partial<SiteConfig> = {
            wordpressUrl: data.wordpressUrl,
            siteName: data.siteName,

            language: data.language,
            installed: true,
            menus: {
                primary: primaryMenu,
                footer: []
            },
            ...(data.homepageSections && { homepageSections: data.homepageSections }),
        };

        if (data.adminUser) {
            configUpdate.auth = {
                username: data.adminUser.username,
                passwordHash: hashPassword(data.adminUser.password),
                sessionSecret: generateSessionSecret(),
            };
        }

        updateSiteConfig(configUpdate);

        // Auto login after install (cookie must be set AFTER the secret is
        // persisted so the token can be verified on subsequent requests).
        if (data.adminUser) {
            await setSessionCookie(data.adminUser.username);
        }

        revalidatePath('/');
        revalidatePath('/manager');

        return { success: true, message: 'Installation complete!' };
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Installation failed',
        };
    }
}

// Verify login
export async function verifyLogin(username: string, password: string): Promise<{ success: boolean; message: string }> {
    try {
        const config = getSiteConfig();

        if (!config.auth) {
            return { success: false, message: 'Authentication not configured' };
        }

        const { valid, needsUpgrade } = verifyPassword(password, config.auth.passwordHash);

        if (config.auth.username !== username || !valid) {
            return { success: false, message: 'Invalid credentials' };
        }

        // Ensure a signing secret exists (older installs may lack one) and
        // opportunistically upgrade legacy SHA-256 hashes to salted scrypt.
        let auth = config.auth;
        if (!auth.sessionSecret) {
            auth = { ...auth, sessionSecret: generateSessionSecret() };
        }
        if (needsUpgrade) {
            auth = { ...auth, passwordHash: hashPassword(password) };
        }
        if (auth !== config.auth) {
            updateSiteConfig({ auth });
        }

        await setSessionCookie(username);
        return { success: true, message: 'Login successful' };
    } catch {
        return { success: false, message: 'Login failed' };
    }
}

// Logout
export async function logout(): Promise<void> {
    await clearSessionCookie();
    revalidatePath('/manager');
}

// Check session (verifies the signed token, not just cookie presence)
export async function checkSession(): Promise<boolean> {
    return (await getSessionUser()) !== null;
}

// Update site settings
export async function updateSettings(data: Partial<SiteConfig>): Promise<{
    success: boolean;
    message: string;
}> {
    if (!(await isManagerAuthenticated())) {
        return { success: false, message: 'Unauthorized' };
    }
    try {
        // Credentials are only changeable through updateAdminCredentials; never
        // let the generic settings channel overwrite auth or install state.
        const { auth: _auth, installed: _installed, ...safeData } = data;
        void _auth; void _installed;
        updateSiteConfig(safeData);
        revalidatePath('/');
        revalidatePath('/manager');

        return { success: true, message: 'Settings saved successfully!' };
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Failed to save settings',
        };
    }
}

// Update menu
export async function updateMenu(
    menuType: 'primary' | 'footer',
    items: MenuItem[]
): Promise<{ success: boolean; message: string }> {
    if (!(await isManagerAuthenticated())) {
        return { success: false, message: 'Unauthorized' };
    }
    try {
        const config = getSiteConfig();
        const menus = { ...config.menus, [menuType]: items };
        updateSiteConfig({ menus });

        revalidatePath('/');

        return { success: true, message: 'Menu updated successfully!' };
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Failed to update menu',
        };
    }
}

// Sync categories from WordPress
export async function syncCategories(): Promise<{
    success: boolean;
    categories: WPCategory[];
    message: string;
}> {
    if (!(await isManagerAuthenticated())) {
        return { success: false, categories: [], message: 'Unauthorized' };
    }
    try {
        const config = getSiteConfig();
        if (!config.wordpressUrl) {
            return { success: false, categories: [], message: 'WordPress URL not configured' };
        }

        const categories = await getCategories(config.wordpressUrl);
        return {
            success: true,
            categories,
            message: `Synced ${categories.length} categories`,
        };
    } catch (error) {
        return {
            success: false,
            categories: [],
            message: error instanceof Error ? error.message : 'Sync failed',
        };
    }
}

// Get current config (client-safe)
export async function getConfig(): Promise<SiteConfig> {
    const config = getSiteConfig();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { auth, ...safeConfig } = config;
    return safeConfig;
}

// Check if installation is complete
export async function checkInstallation(): Promise<boolean> {
    const config = getSiteConfig();
    return config.installed && !!config.wordpressUrl;
}

// Revalidate cache (for webhook)
export async function revalidateContent(path?: string): Promise<{
    success: boolean;
    message: string;
}> {
    try {
        if (path) {
            revalidatePath(path);
        } else {
            revalidatePath('/');
            revalidatePath('/[slug]', 'page');
        }

        return { success: true, message: 'Cache revalidated' };
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Revalidation failed',
        };
    }
}

// Update admin credentials
export async function updateAdminCredentials(data: { username: string; password?: string }): Promise<{ success: boolean; message: string }> {
    if (!(await isManagerAuthenticated())) {
        return { success: false, message: 'Unauthorized' };
    }
    try {
        const config = getSiteConfig();
        const auth = {
            username: data.username,
            passwordHash: data.password ? hashPassword(data.password) : config.auth?.passwordHash || '',
            sessionSecret: config.auth?.sessionSecret || generateSessionSecret(),
        };

        updateSiteConfig({ auth });

        return { success: true, message: 'Credentials updated successfully' };
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Failed to update credentials',
        };
    }
}

// Local Page Management
import fs from 'fs/promises';
import path from 'path';
import { LocalPage } from './config-types';
import { getPages } from './wordpress';

const PAGES_FILE = path.join(process.cwd(), 'src/data/pages.json');

export async function getLocalPages(): Promise<LocalPage[]> {
    try {
        const data = await fs.readFile(PAGES_FILE, 'utf-8');
        return JSON.parse(data);
    } catch {
        return [];
    }
}

export async function saveLocalPage(page: LocalPage): Promise<{ success: boolean; message: string }> {
    if (!(await isManagerAuthenticated())) {
        return { success: false, message: 'Unauthorized' };
    }
    try {
        const pages = await getLocalPages();
        const index = pages.findIndex(p => p.id === page.id);

        if (index >= 0) {
            pages[index] = { ...page, updatedAt: new Date().toISOString() };
        } else {
            pages.push({ ...page, updatedAt: new Date().toISOString() });
        }

        await fs.writeFile(PAGES_FILE, JSON.stringify(pages, null, 2));
        revalidatePath('/[slug]', 'page');
        return { success: true, message: 'Page saved successfully' };
    } catch {
        return { success: false, message: 'Failed to save page' };
    }
}

export async function deleteLocalPage(id: string): Promise<{ success: boolean; message: string }> {
    if (!(await isManagerAuthenticated())) {
        return { success: false, message: 'Unauthorized' };
    }
    try {
        const pages = await getLocalPages();
        const filtered = pages.filter(p => p.id !== id);
        await fs.writeFile(PAGES_FILE, JSON.stringify(filtered, null, 2));
        revalidatePath('/[slug]', 'page');
        return { success: true, message: 'Page deleted successfully' };
    } catch {
        return { success: false, message: 'Failed to delete page' };
    }
}

// Get WordPress Pages for Admin
export async function getWordPressPagesList(): Promise<{ id: string; title: string; slug: string; link: string; date: string }[]> {
    if (!(await isManagerAuthenticated())) return [];
    try {
        const config = getSiteConfig();
        if (!config.wordpressUrl) return [];

        const pages = await getPages(config.wordpressUrl);
        return pages.map(p => ({
            id: String(p.databaseId),
            title: p.title,
            slug: p.slug,
            link: p.uri || '',
            date: p.date || ''
        }));
    } catch (error) {
        console.error('Failed to fetch WP pages:', error);
        return [];
    }
}

// Update System
import {
    checkForUpdates as checkUpdates,
    getCurrentVersion,
    performUpdate as doUpdate,
    rollbackUpdate as doRollback,
    preflightCheck,
    hasBackup,
    listBackups,
    UpdateCheckResult,
    UpdateResult,
    VersionInfo,
    PreflightResult
} from './updater';

export async function checkForAppUpdates(): Promise<UpdateCheckResult> {
    return await checkUpdates();
}

export async function getAppVersion(): Promise<VersionInfo> {
    return getCurrentVersion();
}

export async function performAppUpdate(): Promise<UpdateResult> {
    if (!(await isManagerAuthenticated())) {
        return { success: false, message: 'Unauthorized', error: 'Unauthorized', canRollback: false };
    }
    return await doUpdate();
}

export async function rollbackAppUpdate(): Promise<UpdateResult> {
    if (!(await isManagerAuthenticated())) {
        return { success: false, message: 'Unauthorized', error: 'Unauthorized' };
    }
    return await doRollback();
}

export async function getUpdatePreflightCheck(): Promise<PreflightResult> {
    if (!(await isManagerAuthenticated())) {
        return { canUpdate: false, issues: ['Unauthorized'], warnings: [] };
    }
    return preflightCheck();
}

export async function hasUpdateBackup(): Promise<boolean> {
    if (!(await isManagerAuthenticated())) return false;
    return hasBackup();
}

export async function getUpdateBackups(): Promise<{ path: string; date: string; version?: string }[]> {
    if (!(await isManagerAuthenticated())) return [];
    return listBackups();
}

// Post Comment Action
export async function postCommentAction(postId: number, content: string, author: string, email: string, url?: string, parentId?: string): Promise<{ success: boolean; message: string; comment?: WPComment }> {
    const config = getSiteConfig();
    if (!config.wordpressUrl) {
        return { success: false, message: 'WordPress URL not configured' };
    }

    try {
        return await createComment(config.wordpressUrl, { postId, content, author, email, url, parentId });
    } catch (e) {
        return { success: false, message: e instanceof Error ? e.message : 'Failed to post comment' };
    }
}

// Submit CF7 Action
export async function submitCF7Action(formId: string, formData: FormData): Promise<{ success: boolean; message: string; invalidFields?: CF7InvalidField[] }> {
    const config = getSiteConfig();
    if (!config.wordpressUrl) {
        return { success: false, message: 'WordPress URL not configured' };
    }

    try {
        return await submitContactForm7(config.wordpressUrl, formId, formData);
    } catch (e) {
        return { success: false, message: e instanceof Error ? e.message : 'Failed to submit form' };
    }
}

