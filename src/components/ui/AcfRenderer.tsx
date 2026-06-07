import React from 'react';

interface AcfRendererProps {
    data: Record<string, unknown>;
    className?: string;
}

export default function AcfRenderer({ data, className }: AcfRendererProps) {
    if (!data || Object.keys(data).length === 0) return null;

    // Filter out complex objects or empty values for this basic renderer
    const displayableEntries = Object.entries(data).filter(([, value]) => {
        return value !== null && value !== '' && typeof value !== 'object';
    });

    if (displayableEntries.length === 0) return null;

    return (
        <div className={`acf-container my-8 p-6 bg-secondary/10 rounded-xl border border-border ${className || ''}`}>
            <h3 className="text-lg font-semibold mb-4 border-b border-border pb-2">Additional Information</h3>
            <div className="grid gap-4 sm:grid-cols-2">
                {displayableEntries.map(([key, value]) => {
                    // Format key (e.g. 'event_date' -> 'Event Date')
                    const label = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

                    return (
                        <div key={key} className="acf-field">
                            <span className="block text-xs uppercase tracking-wider opacity-70 mb-1">{label}</span>
                            <span className="text-base font-medium">{String(value)}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
