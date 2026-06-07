'use client';

import { useState } from 'react';
import {
    Layout,
    Grid3X3,
    List,
    Newspaper,
    Image,
    Code,
    Megaphone,
    Star,
    MessageSquareQuote,
    Plus,
    GripVertical,
    Trash2,
    ChevronDown,
    ChevronUp,
    Settings,
    X,
    Play,
    Layers,
    Users,
    HelpCircle,
    DollarSign,
    Mail,
    BarChart3,
    Building,
    Minus,
    MoveVertical,
    LayoutGrid,
    Rows,
    Columns,
    Sparkles,
    FileText,
} from 'lucide-react';
import { Reorder, useDragControls } from 'framer-motion';
import RichEditor from '@/components/editor/RichEditor';
import {
    HomepageSection,
    SectionType,
    sectionTypeLabels,
    sectionDescriptions,
    sectionCategories,
    getDefaultSection,
    HeroSection,
    PostsSection,
    ImageTextSection,
    HtmlBlockSection,
    CtaSection,
    FeaturesSection,
    TestimonialsSection,
    StatsSection,
    FaqSection,
    PricingSection,
    TeamSection,
    ContactSection,
    LogosSection,
    CategoryTabsSection,
    CtaNewsletterSection,
    DividerSection,
    SpacerSection,
    HeroVideoSection,
    HeroSliderSection,
    CtaSplitSection,
    FeaturesIconsSection,
    ImageGallerySection,
    RichTextSection,
    VideoSection,
} from '@/lib/config-types';
import { WPCategory } from '@/lib/wordpress';
import styles from './SectionBuilder.module.css';

interface SectionBuilderProps {
    sections: HomepageSection[];
    onChange: (sections: HomepageSection[]) => void;
    categories: WPCategory[];
}

const sectionIcons: Record<SectionType, React.ElementType> = {
    'hero': Layout,
    'hero-video': Play,
    'hero-slider': Layers,
    'posts-grid': Grid3X3,
    'posts-list': List,
    'posts-magazine': Newspaper,
    'posts-carousel': Rows,
    'posts-masonry': LayoutGrid,
    'posts-cards': Columns,
    'posts-minimal': List,
    'posts-overlay': Image,
    'category-tabs': Layers,
    'image-text': Image,
    'rich-text': FileText,
    'video': Play,
    'image-gallery': Grid3X3,
    'html-block': Code,
    'cta': Megaphone,
    'cta-split': Columns,
    'cta-newsletter': Mail,
    'features': Star,
    'features-icons': Sparkles,
    'stats': BarChart3,
    'testimonials': MessageSquareQuote,
    'logos': Building,
    'faq': HelpCircle,
    'pricing': DollarSign,
    'team': Users,
    'contact': Mail,
    'divider': Minus,
    'spacer': MoveVertical,
};

export default function SectionBuilder({ sections, onChange, categories }: SectionBuilderProps) {
    const [expandedSection, setExpandedSection] = useState<string | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [activeCategory, setActiveCategory] = useState<string>('hero');

    const addSection = (type: SectionType) => {
        const newSection = getDefaultSection(type);
        onChange([...sections, newSection]);
        setExpandedSection(newSection.id);
        setShowAddModal(false);
    };

    const updateSection = (id: string, updates: Partial<HomepageSection>) => {
        onChange(
            sections.map(s => (s.id === id ? { ...s, ...updates } as HomepageSection : s))
        );
    };

    const removeSection = (id: string) => {
        if (confirm('Are you sure you want to remove this section?')) {
            onChange(sections.filter(s => s.id !== id));
        }
    };

    const moveSection = (id: string, direction: 'up' | 'down') => {
        const index = sections.findIndex(s => s.id === id);
        if (
            (direction === 'up' && index === 0) ||
            (direction === 'down' && index === sections.length - 1)
        ) {
            return;
        }
        const newSections = [...sections];
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        [newSections[index], newSections[newIndex]] = [newSections[newIndex], newSections[index]];
        onChange(newSections);
    };

    const toggleSection = (id: string) => {
        setExpandedSection(expandedSection === id ? null : id);
    };

    return (
        <div className={styles.builder}>
            {/* Sections List */}
            {sections.length === 0 ? (
                <div className={styles.emptyState}>
                    <Layout size={48} strokeWidth={1} />
                    <p>No sections yet</p>
                    <p className={styles.emptyHint}>Add your first section to build your homepage</p>
                </div>
            ) : (
                <Reorder.Group axis="y" values={sections} onReorder={onChange} className={styles.sectionsList}>
                    {sections.map((section, index) => (
                        <SortableSectionItem
                            key={section.id}
                            section={section}
                            index={index}
                            total={sections.length}
                            isExpanded={expandedSection === section.id}
                            onToggle={() => toggleSection(section.id)}
                            onMove={moveSection}
                            onRemove={removeSection}
                            onUpdate={updateSection}
                            categories={categories}
                        />
                    ))}
                </Reorder.Group>
            )}

            {/* Add Section Button */}
            <button className={styles.addButton} onClick={() => setShowAddModal(true)}>
                <Plus size={18} />
                Add Section
            </button>

            {/* Add Section Modal */}
            {showAddModal && (
                <div className={styles.modal} onClick={() => setShowAddModal(false)}>
                    <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3>Add Section</h3>
                            <button onClick={() => setShowAddModal(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        {/* Category Tabs */}
                        <div className={styles.categoryTabs}>
                            {Object.entries(sectionCategories).map(([key, cat]) => (
                                <button
                                    key={key}
                                    className={`${styles.categoryTab} ${activeCategory === key ? styles.active : ''}`}
                                    onClick={() => setActiveCategory(key)}
                                >
                                    <span>{cat.icon}</span>
                                    <span>{cat.label}</span>
                                </button>
                            ))}
                        </div>

                        {/* Section Types Grid */}
                        <div className={styles.sectionTypes}>
                            {sectionCategories[activeCategory as keyof typeof sectionCategories]?.types.map(type => {
                                const Icon = sectionIcons[type];
                                return (
                                    <button
                                        key={type}
                                        className={styles.sectionTypeCard}
                                        onClick={() => addSection(type)}
                                    >
                                        <Icon size={24} />
                                        <span className={styles.typeName}>{sectionTypeLabels[type]}</span>
                                        <span className={styles.typeDesc}>{sectionDescriptions[type]}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

interface SortableSectionItemProps {
    section: HomepageSection;
    index: number;
    total: number;
    isExpanded: boolean;
    onToggle: () => void;
    onMove: (id: string, direction: 'up' | 'down') => void;
    onRemove: (id: string) => void;
    onUpdate: (id: string, updates: Partial<HomepageSection>) => void;
    categories: WPCategory[];
}

function SortableSectionItem({
    section,
    index,
    total,
    isExpanded,
    onToggle,
    onMove,
    onRemove,
    onUpdate,
    categories
}: SortableSectionItemProps) {
    const dragControls = useDragControls();
    const Icon = sectionIcons[section.type] || Layout;

    return (
        <Reorder.Item
            value={section}
            dragListener={false}
            dragControls={dragControls}
            className={`${styles.sectionItem} ${isExpanded ? styles.expanded : ''}`}
        >
            {/* Section Header */}
            <div className={styles.sectionHeader} onClick={onToggle}>
                <div className={styles.sectionDrag} onPointerDown={(e) => dragControls.start(e)}>
                    <GripVertical size={16} />
                </div>
                <div className={styles.sectionIcon}>
                    <Icon size={18} />
                </div>
                <div className={styles.sectionInfo}>
                    <span className={styles.sectionType}>{sectionTypeLabels[section.type]}</span>
                    <span className={styles.sectionTitle}>
                        {'title' in section && section.title ? section.title : 'Untitled'}
                    </span>
                </div>
                <div className={styles.sectionActions}>
                    <button
                        onClick={(e) => { e.stopPropagation(); onMove(section.id, 'up'); }}
                        disabled={index === 0}
                        className={styles.actionBtn}
                    >
                        <ChevronUp size={16} />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onMove(section.id, 'down'); }}
                        disabled={index === total - 1}
                        className={styles.actionBtn}
                    >
                        <ChevronDown size={16} />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onRemove(section.id); }}
                        className={`${styles.actionBtn} ${styles.deleteBtn}`}
                    >
                        <Trash2 size={16} />
                    </button>
                    <Settings size={16} className={styles.expandIcon} />
                </div>
            </div>

            {/* Section Editor */}
            {isExpanded && (
                <div className={styles.sectionEditor} onClick={e => e.stopPropagation()}>
                    <SectionEditor
                        section={section}
                        onChange={(updates) => onUpdate(section.id, updates)}
                        categories={categories}
                    />
                </div>
            )}
        </Reorder.Item>
    );
}

// Individual Section Editors
interface SectionEditorProps {
    section: HomepageSection;
    onChange: (updates: Partial<HomepageSection>) => void;
    categories: WPCategory[];
}

function SectionEditor({ section, onChange, categories }: SectionEditorProps) {
    switch (section.type) {
        case 'hero':
            return <HeroEditor section={section} onChange={onChange} />;
        case 'posts-grid':
        case 'posts-list':
        case 'posts-magazine':
        case 'posts-carousel':
        case 'posts-masonry':
        case 'posts-cards':
        case 'posts-minimal':
        case 'posts-overlay':
            return <PostsEditor section={section} onChange={onChange} categories={categories} />;
        case 'category-tabs':
            return <CategoryTabsEditor section={section as CategoryTabsSection} onChange={onChange} categories={categories} />;
        case 'image-text':
            return <ImageTextEditor section={section} onChange={onChange} />;
        case 'html-block':
            return <HtmlBlockEditor section={section} onChange={onChange} />;
        case 'cta':
            return <CtaEditor section={section} onChange={onChange} />;
        case 'cta-newsletter':
            return <NewsletterEditor section={section as CtaNewsletterSection} onChange={onChange} />;
        case 'features':
            return <FeaturesEditor section={section} onChange={onChange} />;
        case 'stats':
            return <StatsEditor section={section as StatsSection} onChange={onChange} />;
        case 'testimonials':
            return <TestimonialsEditor section={section} onChange={onChange} />;
        case 'faq':
            return <FaqEditor section={section as FaqSection} onChange={onChange} />;
        case 'pricing':
            return <PricingEditor section={section as PricingSection} onChange={onChange} />;
        case 'team':
            return <TeamEditor section={section as TeamSection} onChange={onChange} />;
        case 'contact':
            return <ContactEditor section={section as ContactSection} onChange={onChange} />;
        case 'logos':
            return <LogosEditor section={section as LogosSection} onChange={onChange} />;
        case 'divider':
            return <DividerEditor section={section as DividerSection} onChange={onChange} />;
        case 'spacer':
            return <SpacerEditor section={section as SpacerSection} onChange={onChange} />;
        case 'hero-video':
            return <HeroVideoEditor section={section as HeroVideoSection} onChange={onChange} />;
        case 'hero-slider':
            return <HeroSliderEditor section={section as HeroSliderSection} onChange={onChange} />;
        case 'image-gallery':
            return <ImageGalleryEditor section={section as ImageGallerySection} onChange={onChange} />;
        case 'cta-split':
            return <CtaSplitEditor section={section as CtaSplitSection} onChange={onChange} />;
        case 'features-icons':
            return <FeaturesIconsEditor section={section as FeaturesIconsSection} onChange={onChange} />;
        case 'rich-text':
            return <RichTextEditor section={section as RichTextSection} onChange={onChange} />;
        case 'video':
            return <VideoEditor section={section as VideoSection} onChange={onChange} />;
        default:
            return <div className={styles.editorFields}><p>Editor coming soon for this section type.</p></div>;
    }
}

// Hero Section Editor
function HeroEditor({ section, onChange }: { section: HeroSection; onChange: (u: Partial<HeroSection>) => void }) {
    return (
        <div className={styles.editorFields}>
            <div className={styles.field}>
                <label>Title</label>
                <input type="text" value={section.title} onChange={e => onChange({ title: e.target.value })} placeholder="Welcome to Our Site" />
            </div>
            <div className={styles.field}>
                <label>Subtitle</label>
                <textarea value={section.subtitle} onChange={e => onChange({ subtitle: e.target.value })} placeholder="A brief description..." rows={2} />
            </div>
            <div className={styles.fieldRow}>
                <div className={styles.field}>
                    <label>Primary Button</label>
                    <input type="text" value={section.buttonText || ''} onChange={e => onChange({ buttonText: e.target.value })} placeholder="Get Started" />
                </div>
                <div className={styles.field}>
                    <label>Button URL</label>
                    <input type="text" value={section.buttonUrl || ''} onChange={e => onChange({ buttonUrl: e.target.value })} placeholder="/about" />
                </div>
            </div>
            <div className={styles.fieldRow}>
                <div className={styles.field}>
                    <label>Secondary Button</label>
                    <input type="text" value={section.secondaryButtonText || ''} onChange={e => onChange({ secondaryButtonText: e.target.value })} placeholder="Learn More" />
                </div>
                <div className={styles.field}>
                    <label>Secondary URL</label>
                    <input type="text" value={section.secondaryButtonUrl || ''} onChange={e => onChange({ secondaryButtonUrl: e.target.value })} placeholder="#features" />
                </div>
            </div>
            <div className={styles.field}>
                <label>Background Image URL</label>
                <input type="text" value={section.backgroundImage || ''} onChange={e => onChange({ backgroundImage: e.target.value })} placeholder="https://..." />
            </div>
            <div className={styles.fieldRow}>
                <div className={styles.field}>
                    <label>Alignment</label>
                    <select value={section.alignment} onChange={e => onChange({ alignment: e.target.value as 'left' | 'center' | 'right' })}>
                        <option value="left">Left</option>
                        <option value="center">Center</option>
                        <option value="right">Right</option>
                    </select>
                </div>
                <div className={styles.field}>
                    <label>Height</label>
                    <select value={section.height || 'large'} onChange={e => onChange({ height: e.target.value as 'small' | 'medium' | 'large' | 'full' })}>
                        <option value="small">Small</option>
                        <option value="medium">Medium</option>
                        <option value="large">Large</option>
                        <option value="full">Full Screen</option>
                    </select>
                </div>
            </div>
            <div className={styles.field}>
                <label className={styles.checkbox}>
                    <input type="checkbox" checked={section.overlay} onChange={e => onChange({ overlay: e.target.checked })} />
                    Dark Overlay (for readability)
                </label>
            </div>
        </div>
    );
}

// Posts Section Editor
const POST_LAYOUTS = [
    { type: 'posts-grid', label: 'Grid', icon: Grid3X3 },
    { type: 'posts-list', label: 'List', icon: List },
    { type: 'posts-magazine', label: 'Magazine', icon: Newspaper },
    { type: 'posts-carousel', label: 'Slider', icon: Rows },
    { type: 'posts-masonry', label: 'Masonry', icon: LayoutGrid },
    { type: 'posts-cards', label: 'Cards', icon: Columns },
    { type: 'posts-minimal', label: 'Minimal', icon: List },
    { type: 'posts-overlay', label: 'Overlay', icon: Image },
] as const;

function PostsEditor({ section, onChange, categories }: { section: PostsSection; onChange: (u: Partial<PostsSection>) => void; categories: WPCategory[] }) {
    return (
        <div className={styles.editorFields}>
            <div className={styles.field}>
                <label>Layout Style</label>
                <div className={styles.layoutSelector}>
                    {POST_LAYOUTS.map(layout => {
                        const Icon = layout.icon;
                        const isActive = section.type === layout.type;
                        return (
                            <button
                                key={layout.type}
                                className={`${styles.layoutOption} ${isActive ? styles.active : ''}`}
                                onClick={() => onChange({ type: layout.type })}
                                type="button"
                            >
                                <Icon size={24} />
                                <span className={styles.layoutLabel}>{layout.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className={styles.field}>
                <label>Section Title</label>
                <input type="text" value={section.title} onChange={e => onChange({ title: e.target.value })} placeholder="Latest Posts" />
            </div>
            <div className={styles.fieldRow}>
                <div className={styles.field}>
                    <label>Category</label>
                    <select value={section.categoryId} onChange={e => onChange({ categoryId: Number(e.target.value) })}>
                        <option value={0}>All Categories</option>
                        {categories.map(cat => (
                            <option key={cat.databaseId} value={cat.databaseId}>{cat.name} ({cat.count || 0})</option>
                        ))}
                    </select>
                </div>
                <div className={styles.field}>
                    <label>Post Count</label>
                    <input type="number" min={1} max={24} value={section.postCount} onChange={e => onChange({ postCount: Number(e.target.value) })} />
                </div>
            </div>
            {['posts-grid', 'posts-masonry', 'posts-cards', 'posts-overlay'].includes(section.type) && (
                <div className={styles.field}>
                    <label>Columns</label>
                    <select value={section.columns || 3} onChange={e => onChange({ columns: Number(e.target.value) as 2 | 3 | 4 })}>
                        <option value={2}>2 Columns</option>
                        <option value={3}>3 Columns</option>
                        <option value={4}>4 Columns</option>
                    </select>
                </div>
            )}
            <div className={styles.fieldRow}>
                <div className={styles.field}>
                    <label className={styles.checkbox}>
                        <input type="checkbox" checked={section.showViewAll} onChange={e => onChange({ showViewAll: e.target.checked })} />
                        Show &quot;View All&quot; link
                    </label>
                </div>
                <div className={styles.field}>
                    <label className={styles.checkbox}>
                        <input type="checkbox" checked={section.showExcerpt ?? true} onChange={e => onChange({ showExcerpt: e.target.checked })} />
                        Show Excerpt
                    </label>
                </div>
            </div>
            <div className={styles.fieldRow}>
                <div className={styles.field}>
                    <label className={styles.checkbox}>
                        <input type="checkbox" checked={section.showCategory ?? true} onChange={e => onChange({ showCategory: e.target.checked })} />
                        Show Category
                    </label>
                </div>
                <div className={styles.field}>
                    <label className={styles.checkbox}>
                        <input type="checkbox" checked={section.showDate ?? true} onChange={e => onChange({ showDate: e.target.checked })} />
                        Show Date
                    </label>
                </div>
            </div>
        </div>
    );
}

// Category Tabs Editor
function CategoryTabsEditor({ section, onChange, categories }: { section: CategoryTabsSection; onChange: (u: Partial<CategoryTabsSection>) => void; categories: WPCategory[] }) {
    return (
        <div className={styles.editorFields}>
            <div className={styles.field}>
                <label>Section Title</label>
                <input type="text" value={section.title} onChange={e => onChange({ title: e.target.value })} />
            </div>
            <div className={styles.fieldRow}>
                <div className={styles.field}>
                    <label>Posts Per Tab</label>
                    <input type="number" min={1} max={12} value={section.postCount} onChange={e => onChange({ postCount: Number(e.target.value) })} />
                </div>
                <div className={styles.field}>
                    <label>Layout</label>
                    <select value={section.layout} onChange={e => onChange({ layout: e.target.value as 'grid' | 'list' | 'cards' })}>
                        <option value="grid">Grid</option>
                        <option value="list">List</option>
                        <option value="cards">Cards</option>
                    </select>
                </div>
            </div>
            <div className={styles.field}>
                <label>Select Categories (hold Ctrl to select multiple)</label>
                <select
                    multiple
                    value={section.categories.map(String)}
                    onChange={e => onChange({ categories: Array.from(e.target.selectedOptions, o => Number(o.value)) })}
                    style={{ height: 120 }}
                >
                    {categories.map(cat => (
                        <option key={cat.databaseId} value={cat.databaseId}>{cat.name}</option>
                    ))}
                </select>
            </div>
        </div>
    );
}

// Image + Text Editor
function ImageTextEditor({ section, onChange }: { section: ImageTextSection; onChange: (u: Partial<ImageTextSection>) => void }) {
    return (
        <div className={styles.editorFields}>
            <div className={styles.field}>
                <label>Title</label>
                <input type="text" value={section.title} onChange={e => onChange({ title: e.target.value })} placeholder="About Us" />
            </div>
            <div className={styles.field}>
                <label>Content</label>
                <RichEditor value={section.content} onChange={content => onChange({ content })} minHeight={150} />
            </div>
            <div className={styles.fieldRow}>
                <div className={styles.field}>
                    <label>Image URL</label>
                    <input type="text" value={section.imageUrl} onChange={e => onChange({ imageUrl: e.target.value })} placeholder="https://..." />
                </div>
                <div className={styles.field}>
                    <label>Image Position</label>
                    <select value={section.imagePosition} onChange={e => onChange({ imagePosition: e.target.value as 'left' | 'right' })}>
                        <option value="left">Left</option>
                        <option value="right">Right</option>
                    </select>
                </div>
            </div>
            <div className={styles.fieldRow}>
                <div className={styles.field}>
                    <label>Button Text</label>
                    <input type="text" value={section.buttonText || ''} onChange={e => onChange({ buttonText: e.target.value })} />
                </div>
                <div className={styles.field}>
                    <label>Button URL</label>
                    <input type="text" value={section.buttonUrl || ''} onChange={e => onChange({ buttonUrl: e.target.value })} />
                </div>
            </div>
        </div>
    );
}

// HTML Block Editor
function HtmlBlockEditor({ section, onChange }: { section: HtmlBlockSection; onChange: (u: Partial<HtmlBlockSection>) => void }) {
    return (
        <div className={styles.editorFields}>
            <div className={styles.field}>
                <label>Title (Optional)</label>
                <input type="text" value={section.title || ''} onChange={e => onChange({ title: e.target.value })} placeholder="Section Title" />
            </div>
            <div className={styles.field}>
                <label>HTML Content</label>
                <RichEditor value={section.content} onChange={content => onChange({ content })} minHeight={250} />
            </div>
            <div className={styles.fieldRow}>
                <div className={styles.field}>
                    <label className={styles.checkbox}>
                        <input type="checkbox" checked={section.fullWidth} onChange={e => onChange({ fullWidth: e.target.checked })} />
                        Full Width
                    </label>
                </div>
                <div className={styles.field}>
                    <label>Vertical Padding</label>
                    <select value={section.paddingY || 'medium'} onChange={e => onChange({ paddingY: e.target.value as 'none' | 'small' | 'medium' | 'large' })}>
                        <option value="none">None</option>
                        <option value="small">Small</option>
                        <option value="medium">Medium</option>
                        <option value="large">Large</option>
                    </select>
                </div>
            </div>
            <div className={styles.field}>
                <label>Background Color</label>
                <input type="color" value={section.backgroundColor || '#ffffff'} onChange={e => onChange({ backgroundColor: e.target.value })} />
            </div>
        </div>
    );
}

// CTA Editor
function CtaEditor({ section, onChange }: { section: CtaSection; onChange: (u: Partial<CtaSection>) => void }) {
    return (
        <div className={styles.editorFields}>
            <div className={styles.field}>
                <label>Title</label>
                <input type="text" value={section.title} onChange={e => onChange({ title: e.target.value })} />
            </div>
            <div className={styles.field}>
                <label>Subtitle</label>
                <input type="text" value={section.subtitle || ''} onChange={e => onChange({ subtitle: e.target.value })} />
            </div>
            <div className={styles.fieldRow}>
                <div className={styles.field}>
                    <label>Button Text</label>
                    <input type="text" value={section.buttonText} onChange={e => onChange({ buttonText: e.target.value })} />
                </div>
                <div className={styles.field}>
                    <label>Button URL</label>
                    <input type="text" value={section.buttonUrl} onChange={e => onChange({ buttonUrl: e.target.value })} />
                </div>
            </div>
            <div className={styles.fieldRow}>
                <div className={styles.field}>
                    <label>Background Color</label>
                    <input type="color" value={section.backgroundColor || '#0070f3'} onChange={e => onChange({ backgroundColor: e.target.value })} />
                </div>
                <div className={styles.field}>
                    <label>Style</label>
                    <select value={section.style || 'default'} onChange={e => onChange({ style: e.target.value as 'default' | 'gradient' | 'bordered' })}>
                        <option value="default">Default</option>
                        <option value="gradient">Gradient</option>
                        <option value="bordered">Bordered</option>
                    </select>
                </div>
            </div>
        </div>
    );
}

// Newsletter Editor
function NewsletterEditor({ section, onChange }: { section: CtaNewsletterSection; onChange: (u: Partial<CtaNewsletterSection>) => void }) {
    return (
        <div className={styles.editorFields}>
            <div className={styles.field}>
                <label>Title</label>
                <input type="text" value={section.title} onChange={e => onChange({ title: e.target.value })} />
            </div>
            <div className={styles.field}>
                <label>Subtitle</label>
                <input type="text" value={section.subtitle || ''} onChange={e => onChange({ subtitle: e.target.value })} />
            </div>
            <div className={styles.fieldRow}>
                <div className={styles.field}>
                    <label>Input Placeholder</label>
                    <input type="text" value={section.placeholder} onChange={e => onChange({ placeholder: e.target.value })} />
                </div>
                <div className={styles.field}>
                    <label>Button Text</label>
                    <input type="text" value={section.buttonText} onChange={e => onChange({ buttonText: e.target.value })} />
                </div>
            </div>
            <div className={styles.field}>
                <label>Background Color</label>
                <input type="color" value={section.backgroundColor || '#1a1a1a'} onChange={e => onChange({ backgroundColor: e.target.value })} />
            </div>
        </div>
    );
}

// Features Editor
function FeaturesEditor({ section, onChange }: { section: FeaturesSection; onChange: (u: Partial<FeaturesSection>) => void }) {
    const updateFeature = (index: number, updates: Partial<FeaturesSection['features'][0]>) => {
        const newFeatures = section.features.map((f, i) => (i === index ? { ...f, ...updates } : f));
        onChange({ features: newFeatures });
    };

    const addFeature = () => {
        onChange({ features: [...section.features, { icon: '✨', title: 'New Feature', description: 'Description' }] });
    };

    const removeFeature = (index: number) => {
        onChange({ features: section.features.filter((_, i) => i !== index) });
    };

    return (
        <div className={styles.editorFields}>
            <div className={styles.fieldRow}>
                <div className={styles.field}>
                    <label>Title</label>
                    <input type="text" value={section.title} onChange={e => onChange({ title: e.target.value })} />
                </div>
                <div className={styles.field}>
                    <label>Subtitle</label>
                    <input type="text" value={section.subtitle || ''} onChange={e => onChange({ subtitle: e.target.value })} />
                </div>
            </div>
            <div className={styles.fieldRow}>
                <div className={styles.field}>
                    <label>Columns</label>
                    <select value={section.columns} onChange={e => onChange({ columns: Number(e.target.value) as 2 | 3 | 4 })}>
                        <option value={2}>2 Columns</option>
                        <option value={3}>3 Columns</option>
                        <option value={4}>4 Columns</option>
                    </select>
                </div>
                <div className={styles.field}>
                    <label>Style</label>
                    <select value={section.style} onChange={e => onChange({ style: e.target.value as 'cards' | 'simple' | 'bordered' | 'icons-top' | 'icons-left' })}>
                        <option value="cards">Cards</option>
                        <option value="simple">Simple</option>
                        <option value="bordered">Bordered</option>
                        <option value="icons-top">Icons Top</option>
                        <option value="icons-left">Icons Left</option>
                    </select>
                </div>
            </div>
            <div className={styles.field}>
                <label>Features</label>
                <div className={styles.itemsList}>
                    {section.features.map((feature, index) => (
                        <div key={index} className={styles.itemRow}>
                            <input type="text" value={feature.icon} onChange={e => updateFeature(index, { icon: e.target.value })} className={styles.iconInput} placeholder="⚡" />
                            <input type="text" value={feature.title} onChange={e => updateFeature(index, { title: e.target.value })} placeholder="Title" />
                            <input type="text" value={feature.description} onChange={e => updateFeature(index, { description: e.target.value })} placeholder="Description" />
                            <button onClick={() => removeFeature(index)} className={styles.removeBtn}><Trash2 size={14} /></button>
                        </div>
                    ))}
                    <button onClick={addFeature} className={styles.addItemBtn}><Plus size={14} /> Add Feature</button>
                </div>
            </div>
        </div>
    );
}

// Stats Editor
function StatsEditor({ section, onChange }: { section: StatsSection; onChange: (u: Partial<StatsSection>) => void }) {
    const updateStat = (index: number, updates: Partial<StatsSection['stats'][0]>) => {
        const newStats = section.stats.map((s, i) => (i === index ? { ...s, ...updates } : s));
        onChange({ stats: newStats });
    };

    const addStat = () => {
        onChange({ stats: [...section.stats, { value: '0', label: 'Label' }] });
    };

    const removeStat = (index: number) => {
        onChange({ stats: section.stats.filter((_, i) => i !== index) });
    };

    return (
        <div className={styles.editorFields}>
            <div className={styles.fieldRow}>
                <div className={styles.field}>
                    <label>Title</label>
                    <input type="text" value={section.title || ''} onChange={e => onChange({ title: e.target.value })} />
                </div>
                <div className={styles.field}>
                    <label>Style</label>
                    <select value={section.style} onChange={e => onChange({ style: e.target.value as 'default' | 'cards' | 'minimal' })}>
                        <option value="default">Default</option>
                        <option value="cards">Cards</option>
                        <option value="minimal">Minimal</option>
                    </select>
                </div>
            </div>
            <div className={styles.field}>
                <label>Statistics</label>
                <div className={styles.itemsList}>
                    {section.stats.map((stat, index) => (
                        <div key={index} className={styles.itemRow}>
                            <input type="text" value={stat.prefix || ''} onChange={e => updateStat(index, { prefix: e.target.value })} placeholder="$" style={{ width: 40 }} />
                            <input type="text" value={stat.value} onChange={e => updateStat(index, { value: e.target.value })} placeholder="100" />
                            <input type="text" value={stat.suffix || ''} onChange={e => updateStat(index, { suffix: e.target.value })} placeholder="+" style={{ width: 40 }} />
                            <input type="text" value={stat.label} onChange={e => updateStat(index, { label: e.target.value })} placeholder="Label" />
                            <button onClick={() => removeStat(index)} className={styles.removeBtn}><Trash2 size={14} /></button>
                        </div>
                    ))}
                    <button onClick={addStat} className={styles.addItemBtn}><Plus size={14} /> Add Stat</button>
                </div>
            </div>
        </div>
    );
}

// Testimonials Editor
function TestimonialsEditor({ section, onChange }: { section: TestimonialsSection; onChange: (u: Partial<TestimonialsSection>) => void }) {
    const updateTestimonial = (index: number, updates: Partial<TestimonialsSection['testimonials'][0]>) => {
        const newTestimonials = section.testimonials.map((t, i) => (i === index ? { ...t, ...updates } : t));
        onChange({ testimonials: newTestimonials });
    };

    const addTestimonial = () => {
        onChange({ testimonials: [...section.testimonials, { quote: '', author: '', role: '' }] });
    };

    const removeTestimonial = (index: number) => {
        onChange({ testimonials: section.testimonials.filter((_, i) => i !== index) });
    };

    return (
        <div className={styles.editorFields}>
            <div className={styles.fieldRow}>
                <div className={styles.field}>
                    <label>Section Title</label>
                    <input type="text" value={section.title} onChange={e => onChange({ title: e.target.value })} />
                </div>
                <div className={styles.field}>
                    <label>Style</label>
                    <select value={section.style} onChange={e => onChange({ style: e.target.value as 'cards' | 'carousel' | 'simple' | 'quote' })}>
                        <option value="cards">Cards</option>
                        <option value="carousel">Carousel</option>
                        <option value="simple">Simple</option>
                        <option value="quote">Quote</option>
                    </select>
                </div>
            </div>
            <div className={styles.field}>
                <label>Testimonials</label>
                <div className={styles.itemsList}>
                    {section.testimonials.map((testimonial, index) => (
                        <div key={index} className={styles.testimonialItem}>
                            <textarea value={testimonial.quote} onChange={e => updateTestimonial(index, { quote: e.target.value })} placeholder="Quote..." rows={2} />
                            <div className={styles.testimonialMeta}>
                                <input type="text" value={testimonial.author} onChange={e => updateTestimonial(index, { author: e.target.value })} placeholder="Author Name" />
                                <input type="text" value={testimonial.role || ''} onChange={e => updateTestimonial(index, { role: e.target.value })} placeholder="Role" />
                                <input type="number" min={1} max={5} value={testimonial.rating || 5} onChange={e => updateTestimonial(index, { rating: Number(e.target.value) })} placeholder="Rating" />
                            </div>
                            <button onClick={() => removeTestimonial(index)} className={styles.removeBtn}><Trash2 size={14} /></button>
                        </div>
                    ))}
                    <button onClick={addTestimonial} className={styles.addItemBtn}><Plus size={14} /> Add Testimonial</button>
                </div>
            </div>
        </div>
    );
}

// FAQ Editor
function FaqEditor({ section, onChange }: { section: FaqSection; onChange: (u: Partial<FaqSection>) => void }) {
    const updateItem = (index: number, updates: Partial<FaqSection['items'][0]>) => {
        const newItems = section.items.map((item, i) => (i === index ? { ...item, ...updates } : item));
        onChange({ items: newItems });
    };

    const addItem = () => {
        onChange({ items: [...section.items, { question: '', answer: '' }] });
    };

    const removeItem = (index: number) => {
        onChange({ items: section.items.filter((_, i) => i !== index) });
    };

    return (
        <div className={styles.editorFields}>
            <div className={styles.fieldRow}>
                <div className={styles.field}>
                    <label>Title</label>
                    <input type="text" value={section.title} onChange={e => onChange({ title: e.target.value })} />
                </div>
                <div className={styles.field}>
                    <label>Style</label>
                    <select value={section.style} onChange={e => onChange({ style: e.target.value as 'accordion' | 'cards' | 'simple' })}>
                        <option value="accordion">Accordion</option>
                        <option value="cards">Cards</option>
                        <option value="simple">Simple</option>
                    </select>
                </div>
            </div>
            <div className={styles.field}>
                <label>Questions</label>
                <div className={styles.itemsList}>
                    {section.items.map((item, index) => (
                        <div key={index} className={styles.testimonialItem}>
                            <input type="text" value={item.question} onChange={e => updateItem(index, { question: e.target.value })} placeholder="Question" />
                            <textarea value={item.answer} onChange={e => updateItem(index, { answer: e.target.value })} placeholder="Answer" rows={2} />
                            <button onClick={() => removeItem(index)} className={styles.removeBtn}><Trash2 size={14} /></button>
                        </div>
                    ))}
                    <button onClick={addItem} className={styles.addItemBtn}><Plus size={14} /> Add Question</button>
                </div>
            </div>
        </div>
    );
}

// Pricing Editor
function PricingEditor({ section, onChange }: { section: PricingSection; onChange: (u: Partial<PricingSection>) => void }) {
    const updatePlan = (index: number, updates: Partial<PricingSection['plans'][0]>) => {
        const newPlans = section.plans.map((p, i) => (i === index ? { ...p, ...updates } : p));
        onChange({ plans: newPlans });
    };

    const addPlan = () => {
        onChange({ plans: [...section.plans, { name: 'Plan', price: '$0', period: '/month', features: ['Feature'], buttonText: 'Get Started', buttonUrl: '#' }] });
    };

    const removePlan = (index: number) => {
        onChange({ plans: section.plans.filter((_, i) => i !== index) });
    };

    return (
        <div className={styles.editorFields}>
            <div className={styles.fieldRow}>
                <div className={styles.field}>
                    <label>Title</label>
                    <input type="text" value={section.title} onChange={e => onChange({ title: e.target.value })} />
                </div>
                <div className={styles.field}>
                    <label>Subtitle</label>
                    <input type="text" value={section.subtitle || ''} onChange={e => onChange({ subtitle: e.target.value })} />
                </div>
            </div>
            <div className={styles.field}>
                <label>Plans</label>
                <div className={styles.itemsList}>
                    {section.plans.map((plan, index) => (
                        <div key={index} className={styles.testimonialItem}>
                            <div className={styles.testimonialMeta}>
                                <input type="text" value={plan.name} onChange={e => updatePlan(index, { name: e.target.value })} placeholder="Plan Name" />
                                <input type="text" value={plan.price} onChange={e => updatePlan(index, { price: e.target.value })} placeholder="$29" />
                                <input type="text" value={plan.period} onChange={e => updatePlan(index, { period: e.target.value })} placeholder="/month" />
                            </div>
                            <textarea value={plan.features.join('\n')} onChange={e => updatePlan(index, { features: e.target.value.split('\n') })} placeholder="Features (one per line)" rows={3} />
                            <div className={styles.testimonialMeta}>
                                <input type="text" value={plan.buttonText} onChange={e => updatePlan(index, { buttonText: e.target.value })} placeholder="Button" />
                                <input type="text" value={plan.buttonUrl} onChange={e => updatePlan(index, { buttonUrl: e.target.value })} placeholder="URL" />
                                <label className={styles.checkbox} style={{ minWidth: 'auto' }}>
                                    <input type="checkbox" checked={plan.highlighted} onChange={e => updatePlan(index, { highlighted: e.target.checked })} />
                                    Featured
                                </label>
                            </div>
                            <button onClick={() => removePlan(index)} className={styles.removeBtn}><Trash2 size={14} /></button>
                        </div>
                    ))}
                    <button onClick={addPlan} className={styles.addItemBtn}><Plus size={14} /> Add Plan</button>
                </div>
            </div>
        </div>
    );
}

// Team Editor
function TeamEditor({ section, onChange }: { section: TeamSection; onChange: (u: Partial<TeamSection>) => void }) {
    const updateMember = (index: number, updates: Partial<TeamSection['members'][0]>) => {
        const newMembers = section.members.map((m, i) => (i === index ? { ...m, ...updates } : m));
        onChange({ members: newMembers });
    };

    const addMember = () => {
        onChange({ members: [...section.members, { name: '', role: '' }] });
    };

    const removeMember = (index: number) => {
        onChange({ members: section.members.filter((_, i) => i !== index) });
    };

    return (
        <div className={styles.editorFields}>
            <div className={styles.fieldRow}>
                <div className={styles.field}>
                    <label>Title</label>
                    <input type="text" value={section.title} onChange={e => onChange({ title: e.target.value })} />
                </div>
                <div className={styles.field}>
                    <label>Columns</label>
                    <select value={section.columns} onChange={e => onChange({ columns: Number(e.target.value) as 3 | 4 })}>
                        <option value={3}>3 Columns</option>
                        <option value={4}>4 Columns</option>
                    </select>
                </div>
            </div>
            <div className={styles.field}>
                <label>Team Members</label>
                <div className={styles.itemsList}>
                    {section.members.map((member, index) => (
                        <div key={index} className={styles.itemRow}>
                            <input type="text" value={member.name} onChange={e => updateMember(index, { name: e.target.value })} placeholder="Name" />
                            <input type="text" value={member.role} onChange={e => updateMember(index, { role: e.target.value })} placeholder="Role" />
                            <input type="text" value={member.image || ''} onChange={e => updateMember(index, { image: e.target.value })} placeholder="Image URL" />
                            <button onClick={() => removeMember(index)} className={styles.removeBtn}><Trash2 size={14} /></button>
                        </div>
                    ))}
                    <button onClick={addMember} className={styles.addItemBtn}><Plus size={14} /> Add Member</button>
                </div>
            </div>
        </div>
    );
}

// Contact Editor
function ContactEditor({ section, onChange }: { section: ContactSection; onChange: (u: Partial<ContactSection>) => void }) {
    return (
        <div className={styles.editorFields}>
            <div className={styles.fieldRow}>
                <div className={styles.field}>
                    <label>Title</label>
                    <input type="text" value={section.title} onChange={e => onChange({ title: e.target.value })} />
                </div>
                <div className={styles.field}>
                    <label>Subtitle</label>
                    <input type="text" value={section.subtitle || ''} onChange={e => onChange({ subtitle: e.target.value })} />
                </div>
            </div>
            <div className={styles.fieldRow}>
                <div className={styles.field}>
                    <label>Email</label>
                    <input type="email" value={section.email || ''} onChange={e => onChange({ email: e.target.value })} placeholder="hello@example.com" />
                </div>
                <div className={styles.field}>
                    <label>Phone</label>
                    <input type="text" value={section.phone || ''} onChange={e => onChange({ phone: e.target.value })} placeholder="+1 234 567 890" />
                </div>
            </div>
            <div className={styles.field}>
                <label>Address</label>
                <input type="text" value={section.address || ''} onChange={e => onChange({ address: e.target.value })} placeholder="123 Main St, City" />
            </div>
        </div>
    );
}

// Logos Editor
function LogosEditor({ section, onChange }: { section: LogosSection; onChange: (u: Partial<LogosSection>) => void }) {
    const updateLogo = (index: number, updates: Partial<LogosSection['logos'][0]>) => {
        const newLogos = section.logos.map((l, i) => (i === index ? { ...l, ...updates } : l));
        onChange({ logos: newLogos });
    };

    const addLogo = () => {
        onChange({ logos: [...section.logos, { url: '', alt: '' }] });
    };

    const removeLogo = (index: number) => {
        onChange({ logos: section.logos.filter((_, i) => i !== index) });
    };

    return (
        <div className={styles.editorFields}>
            <div className={styles.fieldRow}>
                <div className={styles.field}>
                    <label>Title</label>
                    <input type="text" value={section.title || ''} onChange={e => onChange({ title: e.target.value })} placeholder="Trusted By" />
                </div>
                <div className={styles.field}>
                    <label>Style</label>
                    <select value={section.style} onChange={e => onChange({ style: e.target.value as 'default' | 'grayscale' | 'carousel' })}>
                        <option value="default">Default</option>
                        <option value="grayscale">Grayscale</option>
                        <option value="carousel">Carousel</option>
                    </select>
                </div>
            </div>
            <div className={styles.field}>
                <label>Logos</label>
                <div className={styles.itemsList}>
                    {section.logos.map((logo, index) => (
                        <div key={index} className={styles.itemRow}>
                            <input type="text" value={logo.url} onChange={e => updateLogo(index, { url: e.target.value })} placeholder="Image URL" />
                            <input type="text" value={logo.alt} onChange={e => updateLogo(index, { alt: e.target.value })} placeholder="Alt text" />
                            <input type="text" value={logo.link || ''} onChange={e => updateLogo(index, { link: e.target.value })} placeholder="Link (optional)" />
                            <button onClick={() => removeLogo(index)} className={styles.removeBtn}><Trash2 size={14} /></button>
                        </div>
                    ))}
                    <button onClick={addLogo} className={styles.addItemBtn}><Plus size={14} /> Add Logo</button>
                </div>
            </div>
        </div>
    );
}

// Divider Editor
function DividerEditor({ section, onChange }: { section: DividerSection; onChange: (u: Partial<DividerSection>) => void }) {
    return (
        <div className={styles.editorFields}>
            <div className={styles.fieldRow}>
                <div className={styles.field}>
                    <label>Style</label>
                    <select value={section.style} onChange={e => onChange({ style: e.target.value as 'line' | 'dashed' | 'dotted' | 'gradient' | 'wave' })}>
                        <option value="line">Line</option>
                        <option value="dashed">Dashed</option>
                        <option value="dotted">Dotted</option>
                        <option value="gradient">Gradient</option>
                        <option value="wave">Wave</option>
                    </select>
                </div>
                <div className={styles.field}>
                    <label>Color</label>
                    <input type="color" value={section.color || '#e5e5e5'} onChange={e => onChange({ color: e.target.value })} />
                </div>
            </div>
        </div>
    );
}

// Spacer Editor
function SpacerEditor({ section, onChange }: { section: SpacerSection; onChange: (u: Partial<SpacerSection>) => void }) {
    return (
        <div className={styles.editorFields}>
            <div className={styles.field}>
                <label>Height</label>
                <select value={section.height} onChange={e => onChange({ height: e.target.value as 'small' | 'medium' | 'large' | 'xlarge' })}>
                    <option value="small">Small (1rem)</option>
                    <option value="medium">Medium (2rem)</option>
                    <option value="large">Large (4rem)</option>
                    <option value="xlarge">Extra Large (6rem)</option>
                </select>
            </div>
        </div>
    );
}

// Hero Video Editor
function HeroVideoEditor({ section, onChange }: { section: HeroVideoSection; onChange: (u: Partial<HeroVideoSection>) => void }) {
    return (
        <div className={styles.editorFields}>
            <div className={styles.field}>
                <label>Title</label>
                <input type="text" value={section.title} onChange={e => onChange({ title: e.target.value })} />
            </div>
            <div className={styles.field}>
                <label>Subtitle</label>
                <textarea value={section.subtitle} onChange={e => onChange({ subtitle: e.target.value })} rows={2} />
            </div>
            <div className={styles.fieldRow}>
                <div className={styles.field}>
                    <label>Button Text</label>
                    <input type="text" value={section.buttonText || ''} onChange={e => onChange({ buttonText: e.target.value })} />
                </div>
                <div className={styles.field}>
                    <label>Button URL</label>
                    <input type="text" value={section.buttonUrl || ''} onChange={e => onChange({ buttonUrl: e.target.value })} />
                </div>
            </div>
            <div className={styles.field}>
                <label>Video URL</label>
                <input type="text" value={section.videoUrl} onChange={e => onChange({ videoUrl: e.target.value })} placeholder="https://..." />
            </div>
            <div className={styles.field}>
                <label>Poster Image URL</label>
                <input type="text" value={section.posterImage || ''} onChange={e => onChange({ posterImage: e.target.value })} placeholder="https://..." />
            </div>
        </div>
    );
}

// Hero Slider Editor
function HeroSliderEditor({ section, onChange }: { section: HeroSliderSection; onChange: (u: Partial<HeroSliderSection>) => void }) {
    const updateSlide = (index: number, updates: Partial<HeroSliderSection['slides'][0]>) => {
        const newSlides = section.slides.map((s, i) => (i === index ? { ...s, ...updates } : s));
        onChange({ slides: newSlides });
    };

    const addSlide = () => {
        onChange({ slides: [...section.slides, { title: 'New Slide', subtitle: 'Description', buttonText: 'Learn More', buttonUrl: '#', backgroundImage: '' }] });
    };

    const removeSlide = (index: number) => {
        onChange({ slides: section.slides.filter((_, i) => i !== index) });
    };

    return (
        <div className={styles.editorFields}>
            <div className={styles.fieldRow}>
                <div className={styles.field}>
                    <label className={styles.checkbox}>
                        <input type="checkbox" checked={section.autoPlay} onChange={e => onChange({ autoPlay: e.target.checked })} />
                        Auto Play
                    </label>
                </div>
                <div className={styles.field}>
                    <label>Interval (ms)</label>
                    <input type="number" value={section.interval} onChange={e => onChange({ interval: Number(e.target.value) })} step={500} />
                </div>
            </div>
            <div className={styles.field}>
                <label>Slides</label>
                <div className={styles.itemsList}>
                    {section.slides.map((slide, index) => (
                        <div key={index} className={styles.testimonialItem}>
                            <div className={styles.testimonialMeta}>
                                <input type="text" value={slide.title} onChange={e => updateSlide(index, { title: e.target.value })} placeholder="Title" />
                                <input type="text" value={slide.subtitle} onChange={e => updateSlide(index, { subtitle: e.target.value })} placeholder="Subtitle" />
                            </div>
                            <input type="text" value={slide.backgroundImage} onChange={e => updateSlide(index, { backgroundImage: e.target.value })} placeholder="Background Image URL" style={{ marginTop: '0.5rem' }} />
                            <div className={styles.testimonialMeta} style={{ marginTop: '0.5rem' }}>
                                <input type="text" value={slide.buttonText || ''} onChange={e => updateSlide(index, { buttonText: e.target.value })} placeholder="Button Text" />
                                <input type="text" value={slide.buttonUrl || ''} onChange={e => updateSlide(index, { buttonUrl: e.target.value })} placeholder="Button URL" />
                            </div>
                            <button onClick={() => removeSlide(index)} className={styles.removeBtn}><Trash2 size={14} /></button>
                        </div>
                    ))}
                    <button onClick={addSlide} className={styles.addItemBtn}><Plus size={14} /> Add Slide</button>
                </div>
            </div>
        </div>
    );
}

// CTA Split Editor
function CtaSplitEditor({ section, onChange }: { section: CtaSplitSection; onChange: (u: Partial<CtaSplitSection>) => void }) {
    return (
        <div className={styles.editorFields}>
            <div className={styles.field}>
                <label>Title</label>
                <input type="text" value={section.title} onChange={e => onChange({ title: e.target.value })} />
            </div>
            <div className={styles.field}>
                <label>Content</label>
                <RichEditor value={section.content} onChange={content => onChange({ content })} minHeight={150} />
            </div>
            <div className={styles.fieldRow}>
                <div className={styles.field}>
                    <label>Button Text</label>
                    <input type="text" value={section.buttonText} onChange={e => onChange({ buttonText: e.target.value })} />
                </div>
                <div className={styles.field}>
                    <label>Button URL</label>
                    <input type="text" value={section.buttonUrl} onChange={e => onChange({ buttonUrl: e.target.value })} />
                </div>
            </div>
            <div className={styles.fieldRow}>
                <div className={styles.field}>
                    <label>Image URL</label>
                    <input type="text" value={section.imageUrl} onChange={e => onChange({ imageUrl: e.target.value })} placeholder="https://..." />
                </div>
                <div className={styles.field}>
                    <label>Image Position</label>
                    <select value={section.imagePosition} onChange={e => onChange({ imagePosition: e.target.value as 'left' | 'right' })}>
                        <option value="left">Left</option>
                        <option value="right">Right</option>
                    </select>
                </div>
            </div>
        </div>
    );
}

// Features Icons Editor
function FeaturesIconsEditor({ section, onChange }: { section: FeaturesIconsSection; onChange: (u: Partial<FeaturesIconsSection>) => void }) {
    const updateItem = (index: number, updates: Partial<FeaturesIconsSection['items'][0]>) => {
        const newItems = section.items.map((item, i) => (i === index ? { ...item, ...updates } : item));
        onChange({ items: newItems });
    };

    const addItem = () => {
        onChange({ items: [...section.items, { icon: '✨', label: 'Feature' }] });
    };

    const removeItem = (index: number) => {
        onChange({ items: section.items.filter((_, i) => i !== index) });
    };

    return (
        <div className={styles.editorFields}>
            <div className={styles.field}>
                <label>Title</label>
                <input type="text" value={section.title} onChange={e => onChange({ title: e.target.value })} />
            </div>
            <div className={styles.field}>
                <label>Features</label>
                <div className={styles.itemsList}>
                    {section.items.map((item, index) => (
                        <div key={index} className={styles.itemRow}>
                            <input type="text" value={item.icon} onChange={e => updateItem(index, { icon: e.target.value })} className={styles.iconInput} placeholder="Icon" />
                            <input type="text" value={item.label} onChange={e => updateItem(index, { label: e.target.value })} placeholder="Label" />
                            <button onClick={() => removeItem(index)} className={styles.removeBtn}><Trash2 size={14} /></button>
                        </div>
                    ))}
                    <button onClick={addItem} className={styles.addItemBtn}><Plus size={14} /> Add Item</button>
                </div>
            </div>
        </div>
    );
}

// Image Gallery Editor
function ImageGalleryEditor({ section, onChange }: { section: ImageGallerySection; onChange: (u: Partial<ImageGallerySection>) => void }) {
    const updateImage = (index: number, updates: Partial<ImageGallerySection['images'][0]>) => {
        const newImages = section.images.map((img, i) => (i === index ? { ...img, ...updates } : img));
        onChange({ images: newImages });
    };

    const addImage = () => {
        onChange({ images: [...section.images, { url: '' }] });
    };

    const removeImage = (index: number) => {
        onChange({ images: section.images.filter((_, i) => i !== index) });
    };

    return (
        <div className={styles.editorFields}>
            <div className={styles.fieldRow}>
                <div className={styles.field}>
                    <label>Title</label>
                    <input type="text" value={section.title || ''} onChange={e => onChange({ title: e.target.value })} />
                </div>
                <div className={styles.field}>
                    <label>Columns</label>
                    <select value={section.columns} onChange={e => onChange({ columns: Number(e.target.value) as 2 | 3 | 4 | 5 })}>
                        <option value={2}>2 Columns</option>
                        <option value={3}>3 Columns</option>
                        <option value={4}>4 Columns</option>
                        <option value={5}>5 Columns</option>
                    </select>
                </div>
            </div>
            <div className={styles.field}>
                <label>Gap</label>
                <select value={section.gap} onChange={e => onChange({ gap: e.target.value as 'none' | 'small' | 'medium' | 'large' })}>
                    <option value="none">None</option>
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                </select>
            </div>
            <div className={styles.field}>
                <label>Images</label>
                <div className={styles.itemsList}>
                    {section.images.map((image, index) => (
                        <div key={index} className={styles.itemRow}>
                            <input type="text" value={image.url} onChange={e => updateImage(index, { url: e.target.value })} placeholder="Image URL" />
                            <input type="text" value={image.caption || ''} onChange={e => updateImage(index, { caption: e.target.value })} placeholder="Caption (optional)" />
                            <button onClick={() => removeImage(index)} className={styles.removeBtn}><Trash2 size={14} /></button>
                        </div>
                    ))}
                    <button onClick={addImage} className={styles.addItemBtn}><Plus size={14} /> Add Image</button>
                </div>
            </div>
        </div>
    );
}

// Rich Text Editor
function RichTextEditor({ section, onChange }: { section: RichTextSection; onChange: (u: Partial<RichTextSection>) => void }) {
    return (
        <div className={styles.editorFields}>
            <div className={styles.field}>
                <label>Section Title</label>
                <input type="text" value={section.title || ''} onChange={e => onChange({ title: e.target.value })} />
            </div>
            <div className={styles.field}>
                <label>Content</label>
                <RichEditor value={section.content} onChange={content => onChange({ content })} minHeight={300} />
            </div>
            <div className={styles.fieldRow}>
                <div className={styles.field}>
                    <label>Text Alignment</label>
                    <select value={section.alignment} onChange={e => onChange({ alignment: e.target.value as 'left' | 'center' | 'right' })}>
                        <option value="left">Left</option>
                        <option value="center">Center</option>
                        <option value="right">Right</option>
                    </select>
                </div>
                <div className={styles.field}>
                    <label>Vertical Padding</label>
                    <select value={section.paddingY || 'medium'} onChange={e => onChange({ paddingY: e.target.value as 'small' | 'medium' | 'large' })}>
                        <option value="small">Small</option>
                        <option value="medium">Medium</option>
                        <option value="large">Large</option>
                    </select>
                </div>
            </div>
            <div className={styles.fieldRow}>
                <div className={styles.field}>
                    <label>Background Color</label>
                    <input type="color" value={section.backgroundColor || '#ffffff'} onChange={e => onChange({ backgroundColor: e.target.value })} />
                </div>
                <div className={styles.field}>
                    <label>Text Color</label>
                    <input type="color" value={section.textColor || '#000000'} onChange={e => onChange({ textColor: e.target.value })} />
                </div>
            </div>
        </div>
    );
}

// Video Editor
function VideoEditor({ section, onChange }: { section: VideoSection; onChange: (u: Partial<VideoSection>) => void }) {
    return (
        <div className={styles.editorFields}>
            <div className={styles.field}>
                <label>Section Title</label>
                <input type="text" value={section.title || ''} onChange={e => onChange({ title: e.target.value })} />
            </div>
            <div className={styles.field}>
                <label>Video URL (YouTube, Vimeo, or direct link)</label>
                <input type="text" value={section.videoUrl} onChange={e => onChange({ videoUrl: e.target.value })} placeholder="https://youtube.com/..." />
            </div>
            <div className={styles.fieldRow}>
                <div className={styles.field}>
                    <label>Aspect Ratio</label>
                    <select value={section.aspectRatio} onChange={e => onChange({ aspectRatio: e.target.value as '16:9' | '4:3' | '21:9' })}>
                        <option value="16:9">16:9 (Standard)</option>
                        <option value="4:3">4:3 (Classic)</option>
                        <option value="21:9">21:9 (Ultrawide)</option>
                    </select>
                </div>
                <div className={styles.field}>
                    <label className={styles.checkbox}>
                        <input type="checkbox" checked={section.fullWidth} onChange={e => onChange({ fullWidth: e.target.checked })} />
                        Full Width
                    </label>
                </div>
            </div>
            <div className={styles.fieldRow}>
                <div className={styles.field}>
                    <label className={styles.checkbox}>
                        <input type="checkbox" checked={section.autoPlay} onChange={e => onChange({ autoPlay: e.target.checked })} />
                        Autoplay (Muted)
                    </label>
                </div>
                <div className={styles.field}>
                    <label>Cover Image (for direct video)</label>
                    <input type="text" value={section.coverImage || ''} onChange={e => onChange({ coverImage: e.target.value })} placeholder="https://..." />
                </div>
            </div>
        </div>
    );
}
