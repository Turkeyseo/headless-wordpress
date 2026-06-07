'use client';

import React, { useState } from 'react';
import {
    Book,
    Puzzle,
    Shield,
    Layout,
    FileText,
    MessageSquare,
    ChevronRight,
    Terminal,
    AlertCircle
} from 'lucide-react';
import { SiteConfig } from '@/lib/config-types';

interface HelpDocumentationProps {
    config?: SiteConfig;
}

type DocSection = 'intro' | 'plugins' | 'theme' | 'security' | 'api';

export default function HelpDocumentation({}: HelpDocumentationProps) {
    const [activeSection, setActiveSection] = useState<DocSection>('plugins');

    const containerStyle: React.CSSProperties = {
        display: 'flex',
        minHeight: '600px',
        background: 'var(--manager-bg)',
        padding: '1.5rem',
        borderRadius: '0.75rem',
        border: '1px solid var(--manager-border)',
        gap: '2rem'
    };

    const sidebarStyle: React.CSSProperties = {
        width: '240px',
        flexShrink: 0,
        borderRight: '1px solid var(--manager-border)',
        paddingRight: '1rem',
    };

    const contentStyle: React.CSSProperties = {
        flex: 1,
        maxWidth: '800px'
    };

    const renderMenu = () => (
        <div style={sidebarStyle} className="help-sidebar">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', paddingLeft: '0.5rem' }}>Documentation</h3>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <MenuButton
                    active={activeSection === 'intro'}
                    onClick={() => setActiveSection('intro')}
                    icon={<Book size={18} />}
                    label="Introduction"
                />
                <MenuButton
                    active={activeSection === 'plugins'}
                    onClick={() => setActiveSection('plugins')}
                    icon={<Puzzle size={18} />}
                    label="Plugins & Integrations"
                />
                <MenuButton
                    active={activeSection === 'theme'}
                    onClick={() => setActiveSection('theme')}
                    icon={<Layout size={18} />}
                    label="Theme & Customization"
                />
                <MenuButton
                    active={activeSection === 'security'}
                    onClick={() => setActiveSection('security')}
                    icon={<Shield size={18} />}
                    label="Security"
                />
                <MenuButton
                    active={activeSection === 'api'}
                    onClick={() => setActiveSection('api')}
                    icon={<Terminal size={18} />}
                    label="API & Developer"
                />
            </nav>
        </div>
    );

    const renderContent = () => {
        const headerStyle: React.CSSProperties = {
            borderBottom: '1px solid var(--manager-border)',
            paddingBottom: '1rem',
            marginBottom: '1.5rem'
        };

        const titleStyle: React.CSSProperties = {
            fontSize: '1.75rem',
            fontWeight: 700,
            marginBottom: '0.5rem'
        };

        const subtitleStyle: React.CSSProperties = {
            fontSize: '1.1rem',
            color: 'var(--manager-muted)'
        };

        const cardStyle: React.CSSProperties = {
            background: 'var(--manager-bg)',
            border: '1px solid var(--manager-border)',
            borderRadius: '0.75rem',
            padding: '1.5rem',
            marginBottom: '1.5rem'
        };

        switch (activeSection) {
            case 'intro':
                return (
                    <div style={contentStyle}>
                        <header style={headerStyle}>
                            <h1 style={titleStyle}>Headless WordPress Guide</h1>
                            <p style={subtitleStyle}>
                                Welcome to your new high-performance headless website manager.
                            </p>
                        </header>
                        <div style={{ lineHeight: 1.6, fontSize: '1rem', color: 'var(--manager-text)' }}>
                            <p style={{ marginBottom: '1rem' }}>
                                This system decouples the WordPress backend from the frontend, delivering superior speed, security, and developer experience.
                                You will manage content in WordPress as usual, but control the design and configuration here.
                            </p>
                            <div style={{ ...cardStyle, background: 'var(--manager-bg-alt)' }}>
                                <strong style={{ display: 'block', marginBottom: '0.5rem' }}>Key Features:</strong>
                                <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <li>Super fast page loads with Next.js</li>
                                    <li>Enhanced security (no direct WP database access)</li>
                                    <li>Modern Admin Panel for configuration</li>
                                    <li>Seamless plugin integrations (CF7, Comments, ACF)</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                );

            case 'plugins':
                return (
                    <div style={contentStyle}>
                        <header style={headerStyle}>
                            <h1 style={titleStyle}>Plugins & Integrations</h1>
                            <p style={subtitleStyle}>
                                How to use popular WordPress plugins with this headless setup.
                            </p>
                        </header>

                        {/* Contact Form 7 */}
                        <section id="cf7" style={{ marginBottom: '2rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                                <div style={{ padding: '0.5rem', background: '#dbeafe', borderRadius: '0.5rem', color: '#2563eb' }}>
                                    <FileText size={24} />
                                </div>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Contact Form 7</h2>
                            </div>
                            <div style={cardStyle}>
                                <p style={{ marginBottom: '1rem', color: 'var(--manager-muted)' }}>
                                    Full support for CF7 forms via REST API. No extra addons needed.
                                </p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <div>
                                        <h4 style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                            <span style={{ background: 'var(--manager-text)', color: 'var(--manager-bg)', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>1</span>
                                            Find Form ID
                                        </h4>
                                        <p style={{ fontSize: '0.9rem', color: 'var(--manager-muted)', marginLeft: '2rem' }}>
                                            In WP Admin &gt; Contact, look for shortcode: <code>[contact-form-7 id=&quot;123&quot;...]</code>. ID is <strong>123</strong>.
                                        </p>
                                    </div>
                                    <div>
                                        <h4 style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                            <span style={{ background: 'var(--manager-text)', color: 'var(--manager-bg)', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>2</span>
                                            Developer Usage
                                        </h4>
                                        <div style={{ marginLeft: '2rem' }}>
                                            <CodeBlock code={`<ContactForm7 formId="123" />`} />
                                            <p style={{ fontSize: '0.9rem', color: 'var(--manager-muted)', marginTop: '0.5rem', marginBottom: '0.5rem' }}>
                                                Supports dynamic fields with <code>fields</code> prop:
                                            </p>
                                            <CodeBlock code={`<ContactForm7 
  formId="123" 
  fields={[
    { name: 'cv', type: 'file' },
    { name: 'accept', type: 'checkbox', options: ['Yes'] }
  ]} 
/>`} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <hr style={{ border: 0, borderTop: '1px solid var(--manager-border)', margin: '2rem 0' }} />

                        {/* ACF */}
                        <section id="acf" style={{ marginBottom: '2rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                                <div style={{ padding: '0.5rem', background: '#f3e8ff', borderRadius: '0.5rem', color: '#9333ea' }}>
                                    <Puzzle size={24} />
                                </div>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Advanced Custom Fields (ACF)</h2>
                            </div>
                            <div style={cardStyle}>
                                <p style={{ marginBottom: '1rem', color: 'var(--manager-muted)' }}>
                                    Automatically display custom fields on blog posts.
                                </p>
                                <div style={{ background: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.2)', padding: '1rem', borderRadius: '0.5rem', fontSize: '0.9rem', color: '#ca8a04', marginBottom: '1rem' }}>
                                    <strong style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                        <AlertCircle size={16} /> Requirement:
                                    </strong>
                                    Enable &quot;Show in REST API&quot; in your ACF Field Group settings.
                                </div>
                                <p style={{ fontSize: '0.9rem' }}>
                                    Enable this feature in the <strong>Integrations</strong> tab.
                                </p>
                            </div>
                        </section>

                        {/* Comments */}
                        <section id="comments" style={{ marginBottom: '2rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                                <div style={{ padding: '0.5rem', background: '#dcfce7', borderRadius: '0.5rem', color: '#16a34a' }}>
                                    <MessageSquare size={24} />
                                </div>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Comments System</h2>
                            </div>
                            <div style={cardStyle}>
                                <p style={{ color: 'var(--manager-muted)' }}>
                                    Native WordPress comments are supported. Comments submitted here appear in your WP Dashboard for moderation.
                                </p>
                            </div>
                        </section>
                    </div>
                );

            case 'theme':
                return (
                    <div style={contentStyle}>
                        <header style={headerStyle}>
                            <h1 style={titleStyle}>Theme Customization</h1>
                        </header>
                        <div style={cardStyle}>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.5rem' }}>Globals & Colors</h3>
                            <p style={{ color: 'var(--manager-muted)' }}>
                                Use the <strong>Theme</strong> tab to customize primary colors, fonts, and border radius. These changes are applied instantly via CSS variables.
                            </p>
                        </div>
                    </div>
                );

            case 'security':
                return (
                    <div style={contentStyle}>
                        <header style={headerStyle}>
                            <h1 style={titleStyle}>Security Best Practices</h1>
                        </header>
                        <div style={cardStyle}>
                            <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', color: 'var(--manager-muted)' }}>
                                <li>Keep your Admin Token secret.</li>
                                <li>Change your Admin Path regularly in the Security tab.</li>
                                <li>Enable Two-Factor Authentication on WordPress.</li>
                            </ul>
                        </div>
                    </div>
                );

            case 'api':
                return (
                    <div style={contentStyle}>
                        <header style={headerStyle}>
                            <h1 style={titleStyle}>API & Developer</h1>
                        </header>
                        <div style={cardStyle}>
                            <p style={{ color: 'var(--manager-muted)', marginBottom: '1rem' }}>
                                This headless starter uses WordPress REST API and WPGraphQL.
                            </p>
                            <h4 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Endpoints Used:</h4>
                            <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontFamily: 'monospace', fontSize: '0.9rem', color: 'var(--manager-muted)' }}>
                                <li>/wp-json/wp/v2/posts</li>
                                <li>/wp-json/contact-form-7/v1/contact-forms</li>
                                <li>/graphql</li>
                            </ul>
                        </div>
                    </div>
                );

            default:
                return <div>Select a section</div>;
        }
    };

    return (
        <div style={containerStyle}>
            {renderMenu()}
            {renderContent()}
        </div>
    );
}

function MenuButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
    const buttonStyle: React.CSSProperties = {
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.75rem 1rem',
        borderRadius: '0.5rem',
        fontSize: '0.9rem',
        fontWeight: 500,
        textAlign: 'left',
        cursor: 'pointer',
        border: 'none',
        background: active ? 'var(--manager-text)' : 'transparent',
        color: active ? 'var(--manager-bg)' : 'var(--manager-desc)',
        transition: 'all 0.2s ease'
    };

    return (
        <button
            onClick={onClick}
            style={buttonStyle}
            onMouseEnter={(e) => {
                if (!active) {
                    e.currentTarget.style.background = 'var(--manager-bg-alt)';
                    e.currentTarget.style.color = 'var(--manager-text)';
                }
            }}
            onMouseLeave={(e) => {
                if (!active) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--manager-desc)';
                }
            }}
        >
            {icon}
            {label}
            {active && <ChevronRight size={14} style={{ marginLeft: 'auto', opacity: 0.5 }} />}
        </button>
    );
}

function CodeBlock({ code }: { code: string }) {
    const blockStyle: React.CSSProperties = {
        background: '#0f172a',
        border: '1px solid #1e293b',
        borderRadius: '0.375rem',
        padding: '1rem',
        overflowX: 'auto',
        color: '#f8fafc',
        fontSize: '0.85rem',
        fontFamily: 'monospace',
        lineHeight: 1.5
    };
    return (
        <div style={blockStyle}>
            <pre style={{ margin: 0 }}>{code}</pre>
        </div>
    );
}
