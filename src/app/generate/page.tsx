'use client';

// ═══════════════════════════════════════════════════════════════════════════
// GENERATE PAGE
// Select template, paste JSON, generate filled PDF
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { FileText, ArrowLeft, Play, AlertCircle, CheckCircle2, Code } from 'lucide-react';
import { toast } from 'sonner';
import { isValidJson, safeJsonParse } from '@/lib/utils';
import { useTemplateStore } from '@/store/template';
import type { GenerationData } from '@/types';

export default function GeneratePage() {
    const { fields, templateName, pageCount, pdfUrl } = useTemplateStore();

    const [jsonInput, setJsonInput] = useState('');
    const [validationErrors, setValidationErrors] = useState<string[]>([]);
    const [matchedFields, setMatchedFields] = useState<string[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);

    const validateJson = useCallback((input: string) => {
        if (!input.trim()) {
            setValidationErrors([]);
            setMatchedFields([]);
            return;
        }

        if (!isValidJson(input)) {
            setValidationErrors(['Invalid JSON syntax']);
            setMatchedFields([]);
            return;
        }

        const data = safeJsonParse<GenerationData>(input);
        if (!data || typeof data !== 'object') {
            setValidationErrors(['JSON must be an object']);
            setMatchedFields([]);
            return;
        }

        // Check which fields match
        const dataKeys = Object.keys(data);
        const templateKeys = fields.map((f) => f.key);

        const matched = dataKeys.filter((k) => templateKeys.includes(k));
        const unmatched = dataKeys.filter((k) => !templateKeys.includes(k));
        const missing = templateKeys.filter((k) => !dataKeys.includes(k));

        const errors: string[] = [];
        if (unmatched.length > 0) {
            errors.push(`Unknown keys (will be ignored): ${unmatched.join(', ')}`);
        }
        // We don't treat missing as errors since blank fields are allowed

        setMatchedFields(matched);
        setValidationErrors(errors);
    }, [fields]);

    const handleJsonChange = (value: string) => {
        setJsonInput(value);
        validateJson(value);
    };

    const handleGenerate = async () => {
        if (!isValidJson(jsonInput)) {
            toast.error('Invalid JSON');
            return;
        }

        setIsGenerating(true);

        try {
            // In full implementation, this would call the Python backend
            // For now, show a placeholder message
            toast.success('Generation would happen here!');
            console.log('Data to inject:', safeJsonParse(jsonInput));
            console.log('Template fields:', fields);
        } catch (error) {
            console.error('Generation error:', error);
            toast.error('Failed to generate PDF');
        } finally {
            setIsGenerating(false);
        }
    };

    const hasTemplate = pdfUrl && fields.length > 0;

    const exampleJson = hasTemplate
        ? JSON.stringify(
            fields.reduce((acc, f) => {
                acc[f.key] = f.type === 'checkbox' ? true : `Sample ${f.key}`;
                return acc;
            }, {} as Record<string, unknown>),
            null,
            2
        )
        : '{\n  "field_name": "value"\n}';

    return (
        <div className="min-h-screen flex flex-col">
            {/* Header */}
            <header className="border-b border-graphite">
                <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="flex items-center gap-2 text-steel hover:text-bone transition-colors">
                            <ArrowLeft className="w-4 h-4" />
                            <span className="font-mono text-xs">Home</span>
                        </Link>

                        <div className="w-px h-6 bg-graphite" />

                        <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-electric" />
                            <h1 className="font-mono text-sm font-bold text-bone">
                                Generate PDF
                            </h1>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main content */}
            <main className="flex-1 py-12 px-6">
                <div className="max-w-5xl mx-auto">
                    {!hasTemplate ? (
                        <div className="panel p-12 text-center">
                            <AlertCircle className="w-12 h-12 text-steel mx-auto mb-4" />
                            <h2 className="font-mono text-lg text-bone mb-2">No Template Loaded</h2>
                            <p className="font-mono text-sm text-steel mb-6">
                                Upload a PDF and map fields before generating.
                            </p>
                            <Link href="/" className="btn btn-primary">
                                Go to Upload
                            </Link>
                        </div>
                    ) : (
                        <div className="grid lg:grid-cols-2 gap-8">
                            {/* Template Info */}
                            <div>
                                <h2 className="font-mono text-xs text-steel uppercase tracking-wider mb-4">
                                    Current Template
                                </h2>

                                <div className="panel p-6 mb-6">
                                    <div className="flex items-center gap-3 mb-4">
                                        <FileText className="w-8 h-8 text-electric" />
                                        <div>
                                            <h3 className="font-mono text-sm font-bold text-bone">
                                                {templateName}
                                            </h3>
                                            <p className="font-mono text-xs text-steel">
                                                {pageCount} pages • {fields.length} fields
                                            </p>
                                        </div>
                                    </div>

                                    <div className="border-t border-graphite pt-4">
                                        <p className="font-mono text-[10px] text-steel uppercase tracking-wider mb-2">
                                            Expected Fields
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {fields.map((field) => (
                                                <span
                                                    key={field.id}
                                                    className={`font-mono text-xs px-2 py-1 ${matchedFields.includes(field.key)
                                                            ? 'bg-[var(--color-success)] text-void'
                                                            : 'bg-graphite text-steel'
                                                        }`}
                                                >
                                                    {field.key}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <Link href="/mapper" className="btn btn-ghost w-full">
                                    Edit Template
                                </Link>
                            </div>

                            {/* JSON Input */}
                            <div>
                                <h2 className="font-mono text-xs text-steel uppercase tracking-wider mb-4">
                                    JSON Data
                                </h2>

                                <div className="panel p-4 mb-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Code className="w-4 h-4 text-steel" />
                                        <span className="font-mono text-[10px] text-steel uppercase tracking-wider">
                                            Paste your data
                                        </span>
                                    </div>

                                    <textarea
                                        value={jsonInput}
                                        onChange={(e) => handleJsonChange(e.target.value)}
                                        placeholder={exampleJson}
                                        className="input min-h-[300px] font-mono text-xs resize-none"
                                        spellCheck={false}
                                    />
                                </div>

                                {/* Validation feedback */}
                                {validationErrors.length > 0 && (
                                    <div className="mb-4 p-3 bg-[rgba(255,51,102,0.1)] border border-[var(--color-danger)]">
                                        {validationErrors.map((error, i) => (
                                            <p key={i} className="font-mono text-xs text-[var(--color-danger)] flex items-start gap-2">
                                                <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                                {error}
                                            </p>
                                        ))}
                                    </div>
                                )}

                                {matchedFields.length > 0 && validationErrors.length === 0 && (
                                    <div className="mb-4 p-3 bg-[rgba(0,255,136,0.1)] border border-[var(--color-success)]">
                                        <p className="font-mono text-xs text-[var(--color-success)] flex items-center gap-2">
                                            <CheckCircle2 className="w-3 h-3" />
                                            {matchedFields.length} of {fields.length} fields matched
                                        </p>
                                    </div>
                                )}

                                <button
                                    onClick={handleGenerate}
                                    disabled={!jsonInput.trim() || !isValidJson(jsonInput) || isGenerating}
                                    className="btn btn-primary w-full"
                                >
                                    {isGenerating ? (
                                        <>Generating...</>
                                    ) : (
                                        <>
                                            <Play className="w-4 h-4" />
                                            Generate PDF
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
