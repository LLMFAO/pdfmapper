'use client';

import { useState, useEffect, useMemo } from 'react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { X, Download, Copy, Play, RefreshCw, FileText, Code, LayoutTemplate } from 'lucide-react';
import { toast } from 'sonner';
import { Field } from '@/types';

interface GenerationModalProps {
    isOpen: boolean;
    onClose: () => void;
    fields: Field[];
    pdfUrl: string | null;
    templateName: string;
}

export function GenerationModal({ isOpen, onClose, fields, pdfUrl, templateName }: GenerationModalProps) {
    const [jsonInput, setJsonInput] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'form' | 'json'>('form');

    // Sort fields for logical tab order: Page -> Y position -> X position
    const sortedFields = useMemo(() => {
        return [...fields].sort((a, b) => {
            if (a.page_number !== b.page_number) return a.page_number - b.page_number;
            // Round Y to avoid minor alignment issues affecting order
            const yDiff = Math.round(a.rect.y * 100) - Math.round(b.rect.y * 100);
            if (yDiff !== 0) return yDiff;
            return a.rect.x - b.rect.x;
        });
    }, [fields]);

    // Initial sample generation
    useEffect(() => {
        if (isOpen && !jsonInput && fields.length > 0) {
            generateSampleJson();
        }
    }, [isOpen]);

    // Cleanup preview URL
    useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

    // Debounced Auto-Preview
    useEffect(() => {
        if (!isOpen || !pdfUrl || !jsonInput) return;

        const timer = setTimeout(() => {
            handlePreview();
        }, 800); // 800ms debounce

        return () => clearTimeout(timer);
    }, [jsonInput, isOpen, pdfUrl]);

    const generateSampleJson = () => {
        const sample: Record<string, string | boolean | number> = {};
        fields.forEach(f => {
            if (f.type === 'checkbox') {
                sample[f.key] = false;
            } else if (f.type === 'date') {
                sample[f.key] = new Date().toISOString().split('T')[0];
            } else {
                sample[f.key] = '';
            }
        });
        setJsonInput(JSON.stringify(sample, null, 2));
    };

    const handleFieldChange = (key: string, value: string | boolean | number) => {
        try {
            const currentData = jsonInput ? JSON.parse(jsonInput) : {};
            const newData = { ...currentData, [key]: value };
            setJsonInput(JSON.stringify(newData, null, 2));
        } catch {
            // Ignore invalid JSON state when using form controls
        }
    };

    const getFieldValue = (key: string) => {
        try {
            const data = JSON.parse(jsonInput);
            return data[key] ?? '';
        } catch {
            return '';
        }
    };

    const handlePreview = async () => {
        if (!pdfUrl) return;

        try {
            setIsGenerating(true);

            // Parse Input
            let data: Record<string, any>;
            try {
                data = JSON.parse(jsonInput);
            } catch (e) {
                // Keep old preview if JSON is invalid
                return;
            }

            // Load Buffer
            const existingPdfBytes = await fetch(pdfUrl).then(res => res.arrayBuffer());

            // Load PDF
            const pdfDoc = await PDFDocument.load(existingPdfBytes);
            const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
            const pages = pdfDoc.getPages();

            // Overlay Data
            for (const field of fields) {
                const value = data[field.key];
                if (value === undefined || value === null || value === '') continue;

                const pageIndex = field.page_number - 1;
                if (pageIndex < 0 || pageIndex >= pages.length) continue;

                const page = pages[pageIndex];
                const { width, height } = page.getSize();

                // Calculate Pts & Font Size
                const x = field.rect.x * width + 2; // +padding

                const fontSizeMap = {
                    small: 7,
                    medium: 9,
                    large: 12
                };
                const fontSize = fontSizeMap[field.fontSize || 'medium'];

                // Basic alignment
                const y = height - (field.rect.y * height) - fontSize - 2;
                const boxWidth = (field.rect.w * width) - 4;
                const lineHeight = fontSize * 1.2;

                if (field.type === 'checkbox') {
                    if (String(value).toLowerCase() === 'true' || value === true) {
                        page.drawText('X', {
                            x,
                            y,
                            size: fontSize,
                            font: helveticaFont,
                            color: rgb(0, 0, 0),
                        });
                    }
                } else {
                    page.drawText(String(value), {
                        x,
                        y,
                        size: fontSize,
                        font: helveticaFont,
                        color: rgb(0, 0, 0),
                        maxWidth: boxWidth,
                        lineHeight: lineHeight,
                    });
                }
            }

            // Generate Blob
            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });

            if (previewUrl) URL.revokeObjectURL(previewUrl);

            const url = URL.createObjectURL(blob);
            setPreviewUrl(url);

        } catch (error) {
            console.error(error);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDownload = () => {
        if (!previewUrl) return;
        const link = document.createElement('a');
        link.href = previewUrl;
        link.download = `filled_${(templateName || 'document').replace(/\s+/g, '_')}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('PDF Downloaded');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className={`bg-charcoal border border-graphite rounded-lg shadow-2xl flex flex-col transition-all duration-300 w-full max-w-[95vw] h-[90vh]`}>

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-graphite">
                    <div className="flex items-center gap-4">
                        <h2 className="text-lg font-mono text-bone flex items-center gap-2">
                            <FileText className="w-5 h-5 text-electric" />
                            Generate & Preview
                        </h2>

                        {/* View Toggle */}
                        <div className="flex items-center bg-void border border-graphite rounded-md p-1">
                            <button
                                onClick={() => setViewMode('form')}
                                className={`flex items-center gap-2 px-3 py-1 rounded-sm text-xs font-mono transition-colors ${viewMode === 'form' ? 'bg-charcoal text-electric shadow-sm' : 'text-steel hover:text-bone'
                                    }`}
                            >
                                <LayoutTemplate className="w-3 h-3" />
                                Form
                            </button>
                            <button
                                onClick={() => setViewMode('json')}
                                className={`flex items-center gap-2 px-3 py-1 rounded-sm text-xs font-mono transition-colors ${viewMode === 'json' ? 'bg-charcoal text-electric shadow-sm' : 'text-steel hover:text-bone'
                                    }`}
                            >
                                <Code className="w-3 h-3" />
                                JSON
                            </button>
                        </div>
                    </div>

                    <button onClick={onClose} className="text-steel hover:text-bone">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden flex">
                    {/* Left Panel: Input */}
                    <div className="w-[450px] flex flex-col border-r border-graphite bg-void/30 flex-shrink-0">
                        <div className="flex justify-between items-center p-4 border-b border-graphite/50 bg-charcoal/50">
                            <p className="text-sm text-steel font-mono">Input Data</p>
                            <button
                                onClick={generateSampleJson}
                                className="flex items-center gap-1 bg-charcoal border border-graphite px-2 py-1 rounded text-[10px] text-steel hover:text-bone transition-colors"
                            >
                                <Copy className="w-3 h-3" />
                                Reset / Sample
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                            {viewMode === 'form' ? (
                                <div className="space-y-4">
                                    {sortedFields.map(field => (
                                        <div key={field.key} className="space-y-1.5">
                                            <label className="text-[10px] font-mono uppercase text-steel block tracking-wider truncate" title={field.key}>
                                                {field.key.replace(/_/g, ' ')}
                                            </label>

                                            {field.type === 'checkbox' ? (
                                                <label className="flex items-center gap-2 cursor-pointer p-2 border border-graphite rounded hover:border-steel bg-void/50 transition-colors">
                                                    <input
                                                        type="checkbox"
                                                        checked={!!getFieldValue(field.key)}
                                                        onChange={(e) => handleFieldChange(field.key, e.target.checked)}
                                                        className="w-4 h-4 rounded-sm border-gray-600 bg-transparent text-electric focus:ring-offset-black"
                                                    />
                                                    <span className="text-xs text-bone font-mono">Checked</span>
                                                </label>
                                            ) : field.type === 'date' ? (
                                                <input
                                                    type="date"
                                                    value={getFieldValue(field.key)}
                                                    onChange={(e) => handleFieldChange(field.key, e.target.value)}
                                                    className="w-full bg-void border border-graphite rounded px-3 py-2 font-mono text-xs text-bone focus:border-electric outline-none"
                                                />
                                            ) : (
                                                <input
                                                    type="text"
                                                    value={getFieldValue(field.key)}
                                                    onChange={(e) => handleFieldChange(field.key, e.target.value)}
                                                    className="w-full bg-void border border-graphite rounded px-3 py-2 font-mono text-xs text-bone focus:border-electric outline-none placeholder:text-graphite transition-all hover:bg-void/80"
                                                    placeholder={`Enter ${field.key}...`}
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <textarea
                                    value={jsonInput}
                                    onChange={(e) => setJsonInput(e.target.value)}
                                    className="w-full h-full min-h-[500px] bg-void border border-graphite rounded p-3 font-mono text-xs text-bone focus:border-electric outline-none resize-none"
                                    placeholder="{ ... }"
                                />
                            )}
                        </div>
                    </div>

                    {/* Right Panel: Preview */}
                    <div className="flex-1 flex flex-col bg-graphite/10 relative">
                        {isGenerating && (
                            <div className="absolute top-4 right-4 z-10 bg-charcoal/90 text-electric text-xs font-mono px-3 py-1 rounded-full flex items-center gap-2 shadow-lg border border-electric/20 backdrop-blur-md animate-pulse">
                                <RefreshCw className="w-3 h-3 animate-spin" />
                                Updating...
                            </div>
                        )}

                        {previewUrl ? (
                            <iframe
                                src={`${previewUrl}#toolbar=0&navpanes=0`}
                                className="w-full h-full border-none"
                                title="PDF Preview"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-steel font-mono text-sm flex-col gap-4">
                                <RefreshCw className="w-8 h-8 animate-spin opacity-50" />
                                <p>Initializing Preview...</p>
                            </div>
                        )}

                        {/* Overlay Download Button */}
                        <div className="absolute bottom-6 right-6">
                            <button
                                onClick={handleDownload}
                                className="btn btn-primary shadow-lg flex items-center gap-2 px-6 py-3 text-sm hover:scale-105 transition-transform"
                            >
                                <Download className="w-4 h-4" />
                                Download PDF
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
