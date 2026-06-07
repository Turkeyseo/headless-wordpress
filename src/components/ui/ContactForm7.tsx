'use client';

import { useState, useRef } from 'react';
import { submitCF7Action } from '@/lib/actions';
import { Send, AlertCircle, CheckCircle } from 'lucide-react';
import styles from './ContactForm7.module.css';

// Supported field types in CF7
export type FieldType = 'text' | 'email' | 'url' | 'tel' | 'number' | 'date' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'file';

export interface FormField {
    name: string;
    type: FieldType;
    label?: string;
    placeholder?: string;
    required?: boolean;
    options?: string[]; // For select, radio, checkbox
    defaultValue?: string | string[];
    className?: string; // Custom class for the wrapper
}

interface ContactForm7Props {
    formId: string;
    fields?: FormField[]; // Optional: if provided, renders dynamic fields. Uses default layout otherwise.
    className?: string;
    submitLabel?: string;
}

// Possible values held in the form state: text inputs (string),
// multi-select checkboxes (string[]), file uploads (File), or cleared (null).
type FieldValue = string | string[] | File | null;

const DEFAULT_FIELDS: FormField[] = [
    { name: 'your-name', type: 'text', label: 'Name', required: true },
    { name: 'your-email', type: 'email', label: 'Email', required: true },
    { name: 'your-subject', type: 'text', label: 'Subject' },
    { name: 'your-message', type: 'textarea', label: 'Message', required: true }
];

export default function ContactForm7({ formId, fields = DEFAULT_FIELDS, className, submitLabel = 'Send Message' }: ContactForm7Props) {
    // Initialize form state
    const [formData, setFormData] = useState<Record<string, FieldValue>>(() => {
        const initial: Record<string, FieldValue> = {};
        fields.forEach(field => {
            if (field.type === 'checkbox') {
                initial[field.name] = field.defaultValue || [];
            } else {
                initial[field.name] = field.defaultValue || '';
            }
        });
        return initial;
    });

    const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');
    const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('submitting');

        const data = new FormData();
        Object.entries(formData).forEach(([key, value]) => {
            if (Array.isArray(value)) {
                // For checkboxes, CF7 usually expects multiple entries with same name
                value.forEach(v => data.append(key, v));
            } else if (value instanceof File) {
                data.append(key, value);
            } else {
                data.append(key, value ?? '');
            }
        });

        const res = await submitCF7Action(formId, data);

        if (res.success) {
            setStatus('success');
            setMessage(res.message);
            // Reset form
            const resetData: Record<string, FieldValue> = {};
            fields.forEach(field => {
                resetData[field.name] = field.type === 'checkbox' ? [] : '';
            });
            setFormData(resetData);
            // Reset file inputs
            Object.values(fileInputRefs.current).forEach(input => {
                if (input) input.value = '';
            });
        } else {
            setStatus('error');
            setMessage(res.message);
        }
    };

    const handleChange = (name: string, value: FieldValue) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCheckboxChange = (name: string, value: string, checked: boolean) => {
        setFormData(prev => {
            const current = (prev[name] as string[]) || [];
            if (checked) {
                return { ...prev, [name]: [...current, value] };
            } else {
                return { ...prev, [name]: current.filter(v => v !== value) };
            }
        });
    };

    const handleFileChange = (name: string, files: FileList | null) => {
        if (files && files.length > 0) {
            handleChange(name, files[0]); // Single file upload support for now
        } else {
            handleChange(name, null);
        }
    };

    const renderField = (field: FormField) => {
        const commonProps = {
            id: `${field.name}-${formId}`,
            name: field.name,
            required: field.required,
            className: field.type === 'textarea' ? styles.textarea : styles.input,
            placeholder: field.placeholder,
        };

        switch (field.type) {
            case 'textarea':
                return (
                    <textarea
                        {...commonProps}
                        value={formData[field.name] as string}
                        onChange={e => handleChange(field.name, e.target.value)}
                    />
                );

            case 'select':
                return (
                    <select
                        {...commonProps}
                        className={styles.select}
                        value={formData[field.name] as string}
                        onChange={e => handleChange(field.name, e.target.value)}
                    >
                        <option value="">Select...</option>
                        {field.options?.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                        ))}
                    </select>
                );

            case 'checkbox':
                return (
                    <div className={styles.checkboxGroup}>
                        {field.options?.map(opt => (
                            <label key={opt} className={styles.checkboxLabel}>
                                <input
                                    type="checkbox"
                                    name={field.name}
                                    value={opt}
                                    className={styles.checkbox}
                                    checked={(formData[field.name] as string[]).includes(opt)}
                                    onChange={e => handleCheckboxChange(field.name, opt, e.target.checked)}
                                />
                                {opt}
                            </label>
                        ))}
                    </div>
                );

            case 'radio':
                return (
                    <div className={styles.radioGroup}>
                        {field.options?.map(opt => (
                            <label key={opt} className={styles.radioLabel}>
                                <input
                                    type="radio"
                                    name={field.name}
                                    value={opt}
                                    className={styles.radio}
                                    checked={formData[field.name] === opt}
                                    onChange={() => handleChange(field.name, opt)}
                                    required={field.required}
                                />
                                {opt}
                            </label>
                        ))}
                    </div>
                );

            case 'file':
                return (
                    <input
                        type="file"
                        id={commonProps.id}
                        name={field.name}
                        className={styles.fileInput}
                        required={field.required}
                        onChange={e => handleFileChange(field.name, e.target.files)}
                        ref={el => { fileInputRefs.current[field.name] = el; }}
                    />
                );

            default:
                // text, email, tel, url, number, date
                return (
                    <input
                        type={field.type}
                        {...commonProps}
                        value={formData[field.name] as string}
                        onChange={e => handleChange(field.name, e.target.value)}
                    />
                );
        }
    };

    return (
        <div className={`${styles.container} ${className || ''}`}>
            <form onSubmit={handleSubmit}>
                {fields.map(field => (
                    <div key={field.name} className={`${styles.formGroup} ${field.className || ''}`}>
                        {field.label && (
                            <label htmlFor={`${field.name}-${formId}`} className={styles.label}>
                                {field.label} {field.required && <span style={{ color: 'red' }}>*</span>}
                            </label>
                        )}
                        {renderField(field)}
                    </div>
                ))}

                <button type="submit" disabled={status === 'submitting'} className={styles.button}>
                    {status === 'submitting' ? 'Sending...' : submitLabel}
                    <Send size={16} />
                </button>

                {status === 'success' && (
                    <div className={`${styles.message} ${styles.success}`}>
                        <CheckCircle size={20} />
                        {message}
                    </div>
                )}

                {status === 'error' && (
                    <div className={`${styles.message} ${styles.error}`}>
                        <AlertCircle size={20} />
                        {message}
                    </div>
                )}
            </form>
        </div>
    );
}
