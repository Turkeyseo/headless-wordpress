'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { LocalPage } from '@/lib/config-types';
import { getLocalPages, saveLocalPage, deleteLocalPage, getWordPressPagesList } from '@/lib/actions';
import { Loader2, Plus, Edit, Trash2, ExternalLink, Globe, FileText, Check } from 'lucide-react';
import styles from '@/app/manager/manager.module.css';
import 'react-quill-new/dist/quill.snow.css';

// Dynamic import for ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

interface PagesManagerProps {
    onSave: () => void;
}

// Editor Modules
const modules = {
    toolbar: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike', 'blockquote'],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'indent': '-1' }, { 'indent': '+1' }],
        [{ 'align': [] }],
        ['link', 'image'],
        ['clean'],
        ['code-block']
    ],
};

const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'indent', 'align',
    'link', 'image', 'code-block'
];

export default function PagesManager({ onSave }: PagesManagerProps) {
    const [activeTab, setActiveTab] = useState<'local' | 'wordpress'>('local');
    const [localPages, setLocalPages] = useState<LocalPage[]>([]);
    const [wpPages, setWpPages] = useState<{ id: string; title: string; slug: string; link: string; date: string }[]>([]);
    // Tracks which tab's data is currently loaded; isLoading is derived from it
    // so the load effect never calls setState synchronously
    // (react-hooks/set-state-in-effect).
    const [loadedTab, setLoadedTab] = useState<'local' | 'wordpress' | null>(null);
    const isLoading = loadedTab !== activeTab;

    // Editor State
    const [isEditing, setIsEditing] = useState(false);
    const [currentPage, setCurrentPage] = useState<LocalPage | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Bumping this re-runs the load effect (used to refresh after save/delete).
    const [reloadKey, setReloadKey] = useState(0);
    const refresh = () => setReloadKey((k) => k + 1);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            if (activeTab === 'local') {
                const pages = await getLocalPages();
                if (!cancelled) setLocalPages(pages);
            } else {
                const pages = await getWordPressPagesList();
                if (!cancelled) setWpPages(pages);
            }
            // setState happens only after awaiting (and only if still mounted),
            // keeping the effect free of synchronous setState
            // (react-hooks/set-state-in-effect). The cancel guard also avoids
            // races when the tab is switched mid-fetch.
            if (!cancelled) setLoadedTab(activeTab);
        })();
        return () => {
            cancelled = true;
        };
    }, [activeTab, reloadKey]);

    const handleCreateNew = () => {
        setCurrentPage({
            id: crypto.randomUUID(),
            title: '',
            slug: '',
            content: '',
            seo: { title: '', description: '' },
            status: 'draft',
            updatedAt: new Date().toISOString()
        });
        setIsEditing(true);
    };

    const handleEdit = (page: LocalPage) => {
        setCurrentPage(page);
        setIsEditing(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this page?')) return;
        await deleteLocalPage(id);
        refresh();
    };

    const handleSavePage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentPage) return;

        setIsSaving(true);
        // Ensure slug is clean
        const cleanSlug = currentPage.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

        await saveLocalPage({ ...currentPage, slug: cleanSlug });
        setIsSaving(false);
        setIsEditing(false);
        refresh();
        onSave(); // Trigger toast
    };

    if (isEditing && currentPage) {
        return (
            <div className={styles.settingsSection}>
                <div className={styles.sectionHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2 className={styles.sectionTitle}>{currentPage.id ? 'Edit Page' : 'New Page'}</h2>
                        <p className="hint">Configure your custom Next.js page.</p>
                    </div>
                    <button className="btn btn-outline" onClick={() => setIsEditing(false)} style={{ color: 'var(--manager-foreground)', borderColor: 'var(--manager-border)' }}>
                        Cancel
                    </button>
                </div>
                <div className={styles.sectionContent}>
                    <form onSubmit={handleSavePage}>
                        <div className={styles.formRow}>
                            <div className={styles.formGroup}>
                                <label className="label">Page Title</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={currentPage.title}
                                    onChange={(e) => setCurrentPage({ ...currentPage, title: e.target.value })}
                                    required
                                    placeholder="e.g. Landing Page"
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label className="label">Slug (URL)</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={currentPage.slug}
                                    onChange={(e) => setCurrentPage({ ...currentPage, slug: e.target.value })}
                                    required
                                    placeholder="e.g. landing-page"
                                />
                            </div>
                        </div>

                        <div className={styles.formGroup}>
                            <label className="label">Content</label>
                            <div className="quill-wrapper" style={{ height: '350px', background: 'white', color: 'black', borderRadius: '8px', overflow: 'hidden', paddingBottom: '42px' }}>
                                <ReactQuill
                                    theme="snow"
                                    value={currentPage.content}
                                    onChange={(content) => setCurrentPage({ ...currentPage, content })}
                                    style={{ height: '300px' }}
                                    modules={modules}
                                    formats={formats}
                                />
                            </div>
                        </div>

                        <div className={styles.formGroup}>
                            <label className="label">SEO Title</label>
                            <input
                                type="text"
                                className="input"
                                value={currentPage.seo?.title || ''}
                                onChange={(e) => setCurrentPage({ ...currentPage, seo: { ...currentPage.seo!, title: e.target.value } })}
                                placeholder="Optional custom meta title"
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className="label">Meta Description</label>
                            <textarea
                                className="input"
                                value={currentPage.seo?.description || ''}
                                onChange={(e) => setCurrentPage({ ...currentPage, seo: { ...currentPage.seo!, description: e.target.value } })}
                                rows={2}
                                placeholder="Optional meta description"
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className="label">Status</label>
                            <select
                                className="input"
                                value={currentPage.status}
                                onChange={(e) => setCurrentPage({ ...currentPage, status: e.target.value as 'draft' | 'published' })}
                            >
                                <option value="draft">Draft</option>
                                <option value="published">Published</option>
                            </select>
                        </div>

                        <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
                            <button type="submit" className="btn btn-primary" disabled={isSaving}>
                                {isSaving ? <Loader2 size={16} className="spinner" /> : <Check size={16} />}
                                Save Page
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.settingsSection}>
            <div className={styles.sectionHeader} style={{ marginBottom: '0' }}>
                <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--manager-border)', paddingBottom: '1rem', width: '100%' }}>
                    <button
                        className={`btn ${activeTab === 'local' ? 'btn-primary' : 'btn-ghost'}`}
                        onClick={() => setActiveTab('local')}
                        style={{ borderRadius: '999px' }}
                    >
                        <FileText size={16} style={{ marginRight: '0.5rem' }} />
                        Next.js Pages
                    </button>
                    <button
                        className={`btn ${activeTab === 'wordpress' ? 'btn-primary' : 'btn-ghost'}`}
                        onClick={() => setActiveTab('wordpress')}
                        style={{ borderRadius: '999px' }}
                    >
                        <Globe size={16} style={{ marginRight: '0.5rem' }} />
                        WordPress Pages
                    </button>
                </div>
            </div>

            <div className={styles.sectionContent} style={{ paddingTop: '1.5rem' }}>
                {activeTab === 'local' && (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                            <button className="btn btn-primary" onClick={handleCreateNew}>
                                <Plus size={16} style={{ marginRight: '0.5rem' }} />
                                Add New Page
                            </button>
                        </div>

                        {isLoading ? (
                            <div style={{ padding: '2rem', textAlign: 'center' }}>
                                <Loader2 size={32} className="spinner" style={{ margin: '0 auto', color: 'var(--manager-muted)' }} />
                            </div>
                        ) : localPages.length === 0 ? (
                            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--manager-muted)', border: '1px dashed var(--manager-border)', borderRadius: '8px' }}>
                                <FileText size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                                <p>No custom pages yet. Create one to get started!</p>
                            </div>
                        ) : (
                            <div className={styles.menuList}>
                                {localPages.map(page => (
                                    <div key={page.id} className={styles.menuItem} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.5rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                                            <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                {page.title}
                                                <span style={{
                                                    fontSize: '0.7rem',
                                                    padding: '0.2rem 0.5rem',
                                                    borderRadius: '999px',
                                                    background: page.status === 'published' ? '#d1fae5' : '#f3f4f6',
                                                    color: page.status === 'published' ? '#065f46' : '#374151',
                                                    textTransform: 'uppercase'
                                                }}>
                                                    {page.status}
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <a
                                                    href={`/${page.slug}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="btn btn-sm btn-ghost"
                                                    title="View"
                                                >
                                                    <ExternalLink size={16} />
                                                </a>
                                                <button
                                                    className="btn btn-sm btn-ghost"
                                                    onClick={() => handleEdit(page)}
                                                    title="Edit"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-ghost"
                                                    style={{ color: '#ef4444' }}
                                                    onClick={() => handleDelete(page.id)}
                                                    title="Delete"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--manager-muted)' }}>
                                            /{page.slug}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {activeTab === 'wordpress' && (
                    <>
                        {isLoading ? (
                            <div style={{ padding: '2rem', textAlign: 'center' }}>
                                <Loader2 size={32} className="spinner" style={{ margin: '0 auto', color: 'var(--manager-muted)' }} />
                            </div>
                        ) : (
                            <div className={styles.menuList}>
                                {wpPages.map(page => (
                                    <div key={page.id} className={styles.menuItem} style={{ justifyContent: 'space-between' }}>
                                        <div>
                                            <div style={{ fontWeight: 600 }}>{page.title}</div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--manager-muted)' }}>/{page.slug}</div>
                                        </div>
                                        <a
                                            href={page.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="btn btn-sm btn-ghost"
                                        >
                                            <ExternalLink size={16} />
                                            View
                                        </a>
                                    </div>
                                ))}
                                {wpPages.length === 0 && (
                                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--manager-muted)' }}>
                                        <p>No pages found in WordPress.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
