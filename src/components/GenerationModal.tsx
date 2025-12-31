'use client';

import { useState, useEffect } from 'react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { X, Download, Copy, Play, RefreshCw, FileText, ChevronRight } from 'lucide-react';
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

    const generateSampleJson = () => {
        const sample: Record<string, string | boolean | number> = {};
        fields.forEach(f => {
            if (f.type === 'checkbox') {
                sample[f.key] = true;
            } else if (f.type === 'date') {
                sample[f.key] = new Date().toISOString().split('T')[0];
            } else {
                sample[f.key] = `Value for ${f.key}`;
            }
        });
        setJsonInput(JSON.stringify(sample, null, 2));
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
                toast.error('Invalid JSON');
                setIsGenerating(false);
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
                // Web: Top-Left origin. PDF: Bottom-Left origin.
                const x = field.rect.x * width + 2; // +padding

                const fontSizeMap = {
                    small: 7,
                    medium: 9,
                    large: 12
                };
                const fontSize = fontSizeMap[field.fontSize || 'medium'];

                // Basic alignment: specific offset from top of box
                const y = height - (field.rect.y * height) - fontSize - 2;

                const boxWidth = (field.rect.w * width) - 4; // Width with padding
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

            // Clean up old preview if exists
            if (previewUrl) URL.revokeObjectURL(previewUrl);

            const url = URL.createObjectURL(blob);
            setPreviewUrl(url);

        } catch (error) {
            console.error(error);
            toast.error('Failed to generate preview');
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className={`bg-charcoal border border-graphite rounded-lg shadow-2xl flex flex-col max-h-[90vh] transition-all duration-300 ${previewUrl ? 'w-[90vw] max-w-6xl' : 'w-full max-w-2xl'}`}>

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-graphite">
                    <h2 className="text-lg font-mono text-bone flex items-center gap-2">
                        <FileText className="w-5 h-5 text-electric" />
                        Generate & Preview
                    </h2>
                    <button onClick={onClose} className="text-steel hover:text-bone">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden flex">
                    {/* Left Panel: Input */}
                    <div className={`flex flex-col p-6 space-y-4 border-r border-graphite bg-void/30 ${previewUrl ? 'w-1/3' : 'w-full'}`}>
                        <div className="flex justify-between items-center">
                            <p className="text-sm text-steel font-mono">Input Data (JSON)</p>
                            <button
                                onClick={generateSampleJson}
                                className="flex items-center gap-1 bg-charcoal border border-graphite px-2 py-1 rounded text-[10px] text-steel hover:text-bone transition-colors"
                            >
                                <Copy className="w-3 h-3" />
                                Sample
                            </button>
                        </div>

                        <textarea
                            value={jsonInput}
                            onChange={(e) => setJsonInput(e.target.value)}
                            className="flex-1 w-full bg-void border border-graphite rounded p-3 font-mono text-xs text-bone focus:border-electric outline-none resize-none"
                            placeholder="{ ... }"
                        />

                        <button
                            onClick={handlePreview}
                            disabled={isGenerating || !jsonInput.trim()}
                            className="btn btn-primary w-full flex items-center justify-center gap-2 py-3"
                        >
                            {isGenerating ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                                <Play className="w-4 h-4" />
                            )}
                            {previewUrl ? 'Update Preview' : 'Generate Preview'}
                        </button>
                    </div>

                    {/* Right Panel: Preview */}
                    {previewUrl && (
                        <div className="flex-1 flex flex-col bg-graphite/10 relative">
                            <iframe
                                src={`${previewUrl}#toolbar=0&navpanes=0`}
                                className="w-full h-full border-none"
                                title="PDF Preview"
                            />

                            {/* Overlay Download Button */}
                            <div className="absolute bottom-6 right-6">
                                <button
                                    onClick={handleDownload}
                                    className="btn btn-primary shadow-lg flex items-center gap-2 px-6 py-3 text-sm"
                                >
                                    <Download className="w-4 h-4" />
                                    Download Final PDF
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
