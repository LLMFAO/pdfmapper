'use client';

import { useState } from 'react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { X, Download, Copy, Play } from 'lucide-react';
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

    if (!isOpen) return null;

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

    const handleGenerate = async () => {
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

                // Calculate Pts
                // Web: Top-Left origin. PDF: Bottom-Left origin.
                const x = field.rect.x * width + 2; // +padding

                // Y calculation:
                // field.rect.y is distance from TOP. 
                // We want to draw text at a y-coordinate measured from BOTTOM.
                // Box Top (from Bottom) = height - (field.rect.y * height)
                // We draw text slightly below the top of the box.

                // Calculate Font Size
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

            // Save and Download
            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `filled_${(templateName || 'document').replace(/\s+/g, '_')}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            toast.success('PDF Generated!');

        } catch (error) {
            console.error(error);
            toast.error('Failed to generate PDF');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-charcoal border border-graphite w-full max-w-2xl rounded-lg shadow-2xl flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-graphite">
                    <h2 className="text-lg font-mono text-bone">Generate PDF</h2>
                    <button onClick={onClose} className="text-steel hover:text-bone">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-6 space-y-4">
                    <p className="text-sm text-steel font-mono">
                        Paste JSON data matching the exported schema to fill the template.
                    </p>

                    <div className="relative">
                        <textarea
                            value={jsonInput}
                            onChange={(e) => setJsonInput(e.target.value)}
                            className="w-full h-64 bg-void border border-graphite rounded p-3 font-mono text-xs text-bone focus:border-electric outline-none resize-none"
                            placeholder="{ ... }"
                        />
                        <button
                            onClick={generateSampleJson}
                            className="absolute top-2 right-2 flex items-center gap-1 bg-charcoal border border-graphite px-2 py-1 rounded text-[10px] text-steel hover:text-bone transition-colors"
                        >
                            <Copy className="w-3 h-3" />
                            Sample
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-graphite bg-void/50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="btn btn-ghost"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating || !jsonInput.trim()}
                        className="btn btn-primary flex items-center gap-2"
                    >
                        {isGenerating ? 'Generating...' : (
                            <>
                                <Play className="w-4 h-4" />
                                Generate PDF
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
