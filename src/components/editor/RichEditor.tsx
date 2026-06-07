'use client';

import { useState, useRef, useEffect } from 'react';
import {
    Bold,
    Italic,
    Underline,
    List,
    ListOrdered,
    Link,
    Image,
    Code,
    AlignLeft,
    AlignCenter,
    AlignRight,
    Heading1,
    Heading2,
    Heading3,
    Quote,
    Undo,
    Redo,
} from 'lucide-react';
import styles from './RichEditor.module.css';

interface RichEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    minHeight?: number;
}

// Declared at module scope (not inside render) so it keeps a stable identity
// across renders — see react-hooks/static-components.
function ToolbarButton({
    onClick,
    icon: Icon,
    title
}: {
    onClick: () => void;
    icon: React.ElementType;
    title: string;
}) {
    return (
        <button
            type="button"
            className={styles.toolbarButton}
            onClick={onClick}
            title={title}
        >
            <Icon size={16} />
        </button>
    );
}

export default function RichEditor({
    value,
    onChange,
    placeholder = 'Start typing...',
    minHeight = 200
}: RichEditorProps) {
    const editorRef = useRef<HTMLDivElement>(null);
    const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
    const [linkUrl, setLinkUrl] = useState('');
    const [linkText, setLinkText] = useState('');

    useEffect(() => {
        if (editorRef.current && editorRef.current.innerHTML !== value) {
            editorRef.current.innerHTML = value;
        }
    }, [value]);

    const execCommand = (command: string, value?: string) => {
        document.execCommand(command, false, value);
        editorRef.current?.focus();
        handleInput();
    };

    const handleInput = () => {
        if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            execCommand('insertHTML', '&nbsp;&nbsp;&nbsp;&nbsp;');
        }
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 'b':
                    e.preventDefault();
                    execCommand('bold');
                    break;
                case 'i':
                    e.preventDefault();
                    execCommand('italic');
                    break;
                case 'u':
                    e.preventDefault();
                    execCommand('underline');
                    break;
                case 'z':
                    e.preventDefault();
                    execCommand('undo');
                    break;
                case 'y':
                    e.preventDefault();
                    execCommand('redo');
                    break;
            }
        }
    };

    const insertLink = () => {
        if (linkUrl) {
            const linkHtml = linkText
                ? `<a href="${linkUrl}" target="_blank">${linkText}</a>`
                : `<a href="${linkUrl}" target="_blank">${linkUrl}</a>`;
            execCommand('insertHTML', linkHtml);
        }
        setIsLinkModalOpen(false);
        setLinkUrl('');
        setLinkText('');
    };

    const insertImage = () => {
        const url = prompt('Enter image URL:');
        if (url) {
            execCommand('insertHTML', `<img src="${url}" alt="" style="max-width: 100%; height: auto;" />`);
        }
    };

    return (
        <div className={styles.editorContainer}>
            {/* Toolbar */}
            <div className={styles.toolbar}>
                <div className={styles.toolbarGroup}>
                    <ToolbarButton onClick={() => execCommand('undo')} icon={Undo} title="Undo (Ctrl+Z)" />
                    <ToolbarButton onClick={() => execCommand('redo')} icon={Redo} title="Redo (Ctrl+Y)" />
                </div>

                <div className={styles.toolbarDivider} />

                <div className={styles.toolbarGroup}>
                    <ToolbarButton onClick={() => execCommand('formatBlock', 'h1')} icon={Heading1} title="Heading 1" />
                    <ToolbarButton onClick={() => execCommand('formatBlock', 'h2')} icon={Heading2} title="Heading 2" />
                    <ToolbarButton onClick={() => execCommand('formatBlock', 'h3')} icon={Heading3} title="Heading 3" />
                </div>

                <div className={styles.toolbarDivider} />

                <div className={styles.toolbarGroup}>
                    <ToolbarButton onClick={() => execCommand('bold')} icon={Bold} title="Bold (Ctrl+B)" />
                    <ToolbarButton onClick={() => execCommand('italic')} icon={Italic} title="Italic (Ctrl+I)" />
                    <ToolbarButton onClick={() => execCommand('underline')} icon={Underline} title="Underline (Ctrl+U)" />
                </div>

                <div className={styles.toolbarDivider} />

                <div className={styles.toolbarGroup}>
                    <ToolbarButton onClick={() => execCommand('justifyLeft')} icon={AlignLeft} title="Align Left" />
                    <ToolbarButton onClick={() => execCommand('justifyCenter')} icon={AlignCenter} title="Align Center" />
                    <ToolbarButton onClick={() => execCommand('justifyRight')} icon={AlignRight} title="Align Right" />
                </div>

                <div className={styles.toolbarDivider} />

                <div className={styles.toolbarGroup}>
                    <ToolbarButton onClick={() => execCommand('insertUnorderedList')} icon={List} title="Bullet List" />
                    <ToolbarButton onClick={() => execCommand('insertOrderedList')} icon={ListOrdered} title="Numbered List" />
                    <ToolbarButton onClick={() => execCommand('formatBlock', 'blockquote')} icon={Quote} title="Quote" />
                </div>

                <div className={styles.toolbarDivider} />

                <div className={styles.toolbarGroup}>
                    <ToolbarButton onClick={() => setIsLinkModalOpen(true)} icon={Link} title="Insert Link" />
                    <ToolbarButton onClick={insertImage} icon={Image} title="Insert Image" />
                    <ToolbarButton onClick={() => execCommand('formatBlock', 'pre')} icon={Code} title="Code Block" />
                </div>
            </div>

            {/* Editor */}
            <div
                ref={editorRef}
                className={styles.editor}
                contentEditable
                onInput={handleInput}
                onKeyDown={handleKeyDown}
                style={{ minHeight }}
                data-placeholder={placeholder}
                suppressContentEditableWarning
            />

            {/* Link Modal */}
            {isLinkModalOpen && (
                <div className={styles.modal} onClick={() => setIsLinkModalOpen(false)}>
                    <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                        <h3 className={styles.modalTitle}>Insert Link</h3>
                        <div className={styles.modalField}>
                            <label>URL</label>
                            <input
                                type="url"
                                value={linkUrl}
                                onChange={e => setLinkUrl(e.target.value)}
                                placeholder="https://example.com"
                                autoFocus
                            />
                        </div>
                        <div className={styles.modalField}>
                            <label>Text (optional)</label>
                            <input
                                type="text"
                                value={linkText}
                                onChange={e => setLinkText(e.target.value)}
                                placeholder="Link text"
                            />
                        </div>
                        <div className={styles.modalActions}>
                            <button type="button" onClick={() => setIsLinkModalOpen(false)}>Cancel</button>
                            <button type="button" className={styles.primaryButton} onClick={insertLink}>Insert</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
