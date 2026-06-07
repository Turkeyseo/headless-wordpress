import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const VERSION_FILE = path.join(process.cwd(), 'version.json');
const CONFIG_FILE = path.join(process.cwd(), 'site-config.json');
const BACKUP_DIR = path.join(process.cwd(), '.update-backup');

// Critical files that must be preserved during updates
const PRESERVED_FILES = [
    'site-config.json',
    '.env',
    '.env.local',
    '.env.production',
    '.env.production.local',
];

// Directories to preserve
const PRESERVED_DIRS = [
    'src/data',  // Local pages, custom data
];

export interface VersionInfo {
    version: string;
    releaseDate: string;
    channel: string;
    repository: string;
    updateUrl: string;
}

export interface ReleaseInfo {
    tag_name: string;
    name: string;
    body: string;
    published_at: string;
    html_url: string;
    zipball_url: string;
    tarball_url: string;
}

export interface UpdateCheckResult {
    currentVersion: string;
    latestVersion: string;
    updateAvailable: boolean;
    releaseInfo?: ReleaseInfo;
    error?: string;
}

export interface UpdateResult {
    success: boolean;
    message: string;
    previousVersion?: string;
    newVersion?: string;
    error?: string;
    canRollback?: boolean;
}

export interface PreflightResult {
    canUpdate: boolean;
    issues: string[];
    warnings: string[];
}

/**
 * Get current version info from version.json
 */
export function getCurrentVersion(): VersionInfo {
    try {
        const content = fs.readFileSync(VERSION_FILE, 'utf-8');
        return JSON.parse(content);
    } catch {
        return {
            version: '0.0.0',
            releaseDate: '',
            channel: 'stable',
            repository: 'https://github.com/Turkeyseo/headlesswordpress',
            updateUrl: 'https://api.github.com/repos/Turkeyseo/headlesswordpress/releases/latest'
        };
    }
}

/**
 * Compare semantic versions
 * Returns: 1 if v1 > v2, -1 if v1 < v2, 0 if equal
 */
export function compareVersions(v1: string, v2: string): number {
    const parts1 = v1.replace(/^v/, '').split('.').map(Number);
    const parts2 = v2.replace(/^v/, '').split('.').map(Number);

    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
        const p1 = parts1[i] || 0;
        const p2 = parts2[i] || 0;
        if (p1 > p2) return 1;
        if (p1 < p2) return -1;
    }
    return 0;
}

/**
 * Check for updates from GitHub
 */
export async function checkForUpdates(): Promise<UpdateCheckResult> {
    const currentInfo = getCurrentVersion();

    try {
        const response = await fetch(currentInfo.updateUrl, {
            headers: {
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'Headless-WordPress-Updater'
            },
            next: { revalidate: 0 }
        });

        if (!response.ok) {
            if (response.status === 404) {
                return {
                    currentVersion: currentInfo.version,
                    latestVersion: currentInfo.version,
                    updateAvailable: false,
                    error: 'No releases found'
                };
            }
            throw new Error(`GitHub API error: ${response.status}`);
        }

        const release: ReleaseInfo = await response.json();
        const latestVersion = release.tag_name.replace(/^v/, '');
        const updateAvailable = compareVersions(latestVersion, currentInfo.version) > 0;

        return {
            currentVersion: currentInfo.version,
            latestVersion,
            updateAvailable,
            releaseInfo: release
        };
    } catch (error) {
        return {
            currentVersion: currentInfo.version,
            latestVersion: currentInfo.version,
            updateAvailable: false,
            error: error instanceof Error ? error.message : 'Failed to check for updates'
        };
    }
}

/**
 * Pre-flight checks before update
 */
export function preflightCheck(): PreflightResult {
    const issues: string[] = [];
    const warnings: string[] = [];

    // Check if git is available
    try {
        execSync('git --version', { stdio: 'pipe' });
    } catch {
        issues.push('Git is not installed or not accessible');
    }

    // Check if we're in a git repository
    try {
        execSync('git rev-parse --git-dir', { cwd: process.cwd(), stdio: 'pipe' });
    } catch {
        issues.push('This is not a git repository');
    }

    // Check if remote is configured
    try {
        const remotes = execSync('git remote -v', { cwd: process.cwd(), stdio: 'pipe' }).toString();
        if (!remotes.includes('origin')) {
            issues.push('No origin remote configured');
        }
    } catch {
        issues.push('Could not check git remotes');
    }

    // Check if there's enough disk space (basic check)
    try {
        const stats = fs.statfsSync(process.cwd());
        const freeSpaceMB = (stats.bfree * stats.bsize) / (1024 * 1024);
        if (freeSpaceMB < 100) {
            warnings.push(`Low disk space: ${Math.round(freeSpaceMB)}MB available`);
        }
    } catch {
        // statfsSync might not be available on all platforms
    }

    // Check if config file exists and is readable
    if (fs.existsSync(CONFIG_FILE)) {
        try {
            JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
        } catch {
            warnings.push('site-config.json exists but may be corrupted');
        }
    }

    // Check for uncommitted changes
    try {
        const status = execSync('git status --porcelain', { cwd: process.cwd(), stdio: 'pipe' }).toString();
        if (status.trim()) {
            warnings.push('You have uncommitted local changes that may be lost');
        }
    } catch {
        // Ignore
    }

    return {
        canUpdate: issues.length === 0,
        issues,
        warnings
    };
}

/**
 * Create backup of critical files
 */
export function createBackup(): { success: boolean; backupPath?: string; error?: string } {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(BACKUP_DIR, timestamp);

    try {
        // Create backup directory
        fs.mkdirSync(backupPath, { recursive: true });

        // Backup version info for rollback
        const versionInfo = getCurrentVersion();
        fs.writeFileSync(
            path.join(backupPath, 'version-info.json'),
            JSON.stringify({ ...versionInfo, backupTime: timestamp }, null, 2)
        );

        // Backup critical files
        for (const file of PRESERVED_FILES) {
            const filePath = path.join(process.cwd(), file);
            if (fs.existsSync(filePath)) {
                fs.copyFileSync(filePath, path.join(backupPath, file));
            }
        }

        // Backup critical directories
        for (const dir of PRESERVED_DIRS) {
            const dirPath = path.join(process.cwd(), dir);
            if (fs.existsSync(dirPath)) {
                copyDirSync(dirPath, path.join(backupPath, dir));
            }
        }

        // Store current git commit for rollback
        try {
            const commit = execSync('git rev-parse HEAD', { cwd: process.cwd(), stdio: 'pipe' }).toString().trim();
            fs.writeFileSync(path.join(backupPath, 'git-commit.txt'), commit);
        } catch {
            // If git fails, we can still continue
        }

        return { success: true, backupPath };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to create backup'
        };
    }
}

/**
 * Restore from backup
 */
export function restoreFromBackup(backupPath?: string): { success: boolean; error?: string } {
    try {
        // Find most recent backup if not specified
        if (!backupPath) {
            if (!fs.existsSync(BACKUP_DIR)) {
                return { success: false, error: 'No backup directory found' };
            }
            const backups = fs.readdirSync(BACKUP_DIR).sort().reverse();
            if (backups.length === 0) {
                return { success: false, error: 'No backups available' };
            }
            backupPath = path.join(BACKUP_DIR, backups[0]);
        }

        if (!fs.existsSync(backupPath)) {
            return { success: false, error: 'Backup not found' };
        }

        // Restore git commit if available
        const commitFile = path.join(backupPath, 'git-commit.txt');
        if (fs.existsSync(commitFile)) {
            const commit = fs.readFileSync(commitFile, 'utf-8').trim();
            try {
                execSync(`git reset --hard ${commit}`, { cwd: process.cwd(), stdio: 'pipe' });
            } catch {
                // Git rollback failed, but we can still restore files
            }
        }

        // Restore files
        for (const file of PRESERVED_FILES) {
            const backedUpFile = path.join(backupPath, file);
            if (fs.existsSync(backedUpFile)) {
                fs.copyFileSync(backedUpFile, path.join(process.cwd(), file));
            }
        }

        // Restore directories
        for (const dir of PRESERVED_DIRS) {
            const backedUpDir = path.join(backupPath, dir);
            if (fs.existsSync(backedUpDir)) {
                const targetDir = path.join(process.cwd(), dir);
                fs.mkdirSync(targetDir, { recursive: true });
                copyDirSync(backedUpDir, targetDir);
            }
        }

        return { success: true };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to restore backup'
        };
    }
}

/**
 * Helper: Copy directory recursively
 */
function copyDirSync(src: string, dest: string): void {
    fs.mkdirSync(dest, { recursive: true });
    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            copyDirSync(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

/**
 * Perform the update (SAFE VERSION)
 */
export async function performUpdate(): Promise<UpdateResult> {
    const currentInfo = getCurrentVersion();
    const previousVersion = currentInfo.version;

    // Step 1: Pre-flight checks
    const preflight = preflightCheck();
    if (!preflight.canUpdate) {
        return {
            success: false,
            message: 'Pre-flight check failed',
            error: preflight.issues.join('; '),
            canRollback: false
        };
    }

    // Step 2: Create backup FIRST
    const backup = createBackup();
    if (!backup.success) {
        return {
            success: false,
            message: 'Failed to create backup',
            error: backup.error,
            canRollback: false
        };
    }

    try {
        // Step 3: Store all preserved files in memory
        const preservedData: Map<string, string> = new Map();

        for (const file of PRESERVED_FILES) {
            const filePath = path.join(process.cwd(), file);
            if (fs.existsSync(filePath)) {
                preservedData.set(file, fs.readFileSync(filePath, 'utf-8'));
            }
        }

        // Step 4: Stash local changes (safety measure)
        try {
            execSync('git stash --include-untracked', { cwd: process.cwd(), stdio: 'pipe' });
        } catch {
            // Stash may fail if no changes, that's okay
        }

        // Step 5: Fetch updates (don't apply yet)
        try {
            execSync('git fetch origin', { cwd: process.cwd(), stdio: 'pipe' });
        } catch (error) {
            restoreFromBackup(backup.backupPath);
            return {
                success: false,
                message: 'Failed to fetch updates',
                error: error instanceof Error ? error.message : 'Git fetch failed',
                canRollback: true
            };
        }

        // Step 6: Check which branch to use
        let branch = 'main';
        try {
            execSync('git rev-parse --verify origin/main', { cwd: process.cwd(), stdio: 'pipe' });
        } catch {
            try {
                execSync('git rev-parse --verify origin/master', { cwd: process.cwd(), stdio: 'pipe' });
                branch = 'master';
            } catch {
                restoreFromBackup(backup.backupPath);
                return {
                    success: false,
                    message: 'Could not find main or master branch',
                    canRollback: true
                };
            }
        }

        // Step 7: Apply update
        try {
            execSync(`git reset --hard origin/${branch}`, { cwd: process.cwd(), stdio: 'pipe' });
        } catch (error) {
            restoreFromBackup(backup.backupPath);
            return {
                success: false,
                message: 'Failed to apply update',
                error: error instanceof Error ? error.message : 'Git reset failed',
                canRollback: true
            };
        }

        // Step 8: IMMEDIATELY restore preserved files
        for (const [file, content] of preservedData) {
            const filePath = path.join(process.cwd(), file);
            fs.writeFileSync(filePath, content);
        }

        // Step 9: Restore preserved directories from backup
        for (const dir of PRESERVED_DIRS) {
            const backedUpDir = path.join(backup.backupPath!, dir);
            if (fs.existsSync(backedUpDir)) {
                const targetDir = path.join(process.cwd(), dir);
                fs.rmSync(targetDir, { recursive: true, force: true });
                copyDirSync(backedUpDir, targetDir);
            }
        }

        // Step 10: Install dependencies (don't fail the update if this fails)
        let npmWarning = '';
        try {
            execSync('npm install --legacy-peer-deps', { cwd: process.cwd(), stdio: 'pipe', timeout: 120000 });
        } catch {
            npmWarning = ' (Note: npm install had issues - you may need to run it manually)';
        }

        // Step 11: Get new version
        const newInfo = getCurrentVersion();

        return {
            success: true,
            message: `Update completed successfully!${npmWarning} Please restart the application.`,
            previousVersion,
            newVersion: newInfo.version,
            canRollback: true
        };

    } catch (error) {
        // Any unexpected error - attempt rollback
        restoreFromBackup(backup.backupPath);

        return {
            success: false,
            message: 'Update failed unexpectedly',
            error: error instanceof Error ? error.message : 'Unknown error',
            canRollback: true
        };
    }
}

/**
 * Rollback to previous version
 */
export async function rollbackUpdate(): Promise<UpdateResult> {
    const result = restoreFromBackup();

    if (result.success) {
        return {
            success: true,
            message: 'Rollback completed. Please restart the application.'
        };
    } else {
        return {
            success: false,
            message: 'Rollback failed',
            error: result.error
        };
    }
}

/**
 * Get changelog/release notes
 */
export async function getReleaseNotes(): Promise<{ notes: string; version: string } | null> {
    const currentInfo = getCurrentVersion();

    try {
        const response = await fetch(currentInfo.updateUrl, {
            headers: {
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'Headless-WordPress-Updater'
            }
        });

        if (!response.ok) return null;

        const release: ReleaseInfo = await response.json();
        return {
            notes: release.body || 'No release notes available.',
            version: release.tag_name
        };
    } catch {
        return null;
    }
}

/**
 * Check if rollback is available
 */
export function hasBackup(): boolean {
    if (!fs.existsSync(BACKUP_DIR)) return false;
    const backups = fs.readdirSync(BACKUP_DIR);
    return backups.length > 0;
}

/**
 * List available backups
 */
export function listBackups(): { path: string; date: string; version?: string }[] {
    if (!fs.existsSync(BACKUP_DIR)) return [];

    return fs.readdirSync(BACKUP_DIR)
        .sort()
        .reverse()
        .map(name => {
            const backupPath = path.join(BACKUP_DIR, name);
            const versionInfoPath = path.join(backupPath, 'version-info.json');
            let version: string | undefined;

            try {
                if (fs.existsSync(versionInfoPath)) {
                    const info = JSON.parse(fs.readFileSync(versionInfoPath, 'utf-8'));
                    version = info.version;
                }
            } catch {
                // Ignore
            }

            return {
                path: backupPath,
                date: name,
                version
            };
        });
}
