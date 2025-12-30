'use client';

// ═══════════════════════════════════════════════════════════════════════════
// PDF MAPPER PAGE
// Main canvas for mapping fields onto PDF pages
// ═══════════════════════════════════════════════════════════════════════════

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FileText, ArrowLeft, Save, Download, Upload, Play } from 'lucide-react';
import { toast } from 'sonner';
import { PDFCanvas } from '@/components/PDFCanvas';
import { FieldSidebar } from '@/components/FieldSidebar';
import { GenerationModal } from '@/components/GenerationModal';
import { useTemplateStore } from '@/store/template';
import { downloadJson, readJsonFile } from '@/lib/utils';
import { Field } from '@/types';

export default function MapperPage() {
    const router = useRouter();
    const { pdfUrl, fields, templateName, pageCount, setFields, setTemplateName } = useTemplateStore();
    const [isGenerationModalOpen, setIsGenerationModalOpen] = useState(false);

    // Redirect if no PDF loaded
    useEffect(() => {
        if (!pdfUrl) {
            router.push('/');
        }
    }, [pdfUrl, router]);

    const handleSaveTemplate = () => {
        const template = {
            name: templateName || 'Untitled Template',
            created_at: new Date().toISOString(),
            version: '1.0.0',
            page_count: pageCount,
            fields: fields,
        };

        const baseName = (templateName || 'untitled').toLowerCase().replace(/\s+/g, '_');
        const filename = `${baseName}.template.json`;
        downloadJson(template, filename);
        toast.success('Template saved to disk');
    };

    const handleImportTemplate = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            e.target.value = ''; // Reset
            const data = await readJsonFile<{ name: string; fields: Field[] }>(file);

            if (!Array.isArray(data.fields)) {
                throw new Error('Invalid template format');
            }

            if (data.name) setTemplateName(data.name);
            setFields(data.fields);
            toast.success('Template imported successfully');
        } catch (error) {
            console.error(error);
            toast.error('Failed to import template');
        }
    };

    const handleExportSchema = () => {
        // Generate JSON schema from fields
        const schema = {
            type: 'object',
            properties: fields.reduce((acc, field) => {
                acc[field.key] = {
                    type: field.type === 'checkbox' ? 'boolean' : 'string',
                    description: `Page ${field.page_number}`,
                };
                return acc;
            }, {} as Record<string, object>),
            required: fields.map((f) => f.key),
        };

        // Download as file
        const blob = new Blob([JSON.stringify(schema, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const baseName = (templateName || 'untitled').toLowerCase().replace(/\s+/g, '_');
        a.download = `${baseName}.schema.json`;
        a.click();
        URL.revokeObjectURL(url);

        toast.success('Schema exported!');
    };

    if (!pdfUrl) {
        return null; // Will redirect
    }

    return (
        <div className="min-h-screen flex flex-col">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-void border-b border-graphite">
                <div className="px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="flex items-center gap-2 text-steel hover:text-bone transition-colors">
                            <ArrowLeft className="w-4 h-4" />
                            <span className="font-mono text-xs">Back</span>
                        </Link>

                        <div className="w-px h-6 bg-graphite" />

                        <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-electric" />
                            <span className="font-mono text-sm text-bone">
                                {templateName || 'Untitled Template'}
                            </span>
                            <span className="font-mono text-xs text-steel">
                                ({pageCount} pages)
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="font-mono text-xs text-steel">
                            {fields.length} field{fields.length !== 1 ? 's' : ''}
                        </span>

                        <label className="btn btn-ghost text-xs py-2 cursor-pointer">
                            <Upload className="w-4 h-4" />
                            Import Template
                            <input
                                type="file"
                                className="hidden"
                                accept=".json"
                                onChange={handleImportTemplate}
                            />
                        </label>

                        <button
                            onClick={() => setIsGenerationModalOpen(true)}
                            className="btn btn-ghost text-xs py-2 text-electric hover:text-electric hover:bg-electric/10"
                            disabled={fields.length === 0}
                        >
                            <Play className="w-4 h-4" />
                            Generate PDF
                        </button>

                        <button
                            onClick={handleExportSchema}
                            className="btn btn-ghost text-xs py-2"
                            disabled={fields.length === 0}
                        >
                            <Download className="w-4 h-4" />
                            Export Schema
                        </button>

                        <button
                            onClick={handleSaveTemplate}
                            className="btn btn-primary text-xs py-2"
                            disabled={fields.length === 0}
                        >
                            <Save className="w-4 h-4" />
                            Save Template
                        </button>
                    </div>
                </div>

                {/* Instructions bar */}
                <div className="px-6 py-2 bg-charcoal border-t border-graphite">
                    <p className="font-mono text-[10px] text-steel text-center">
                        Click and drag on the PDF to draw field rectangles • Click a field to select it •
                        Use corner handles to resize • Edit field labels in the sidebar
                    </p>
                </div>
            </header>

            {/* Main content */}
            <div className="flex-1 flex">
                {/* PDF Canvas area */}
                <main className="flex-1 overflow-auto p-8 mr-[320px]">
                    <PDFCanvas />
                </main>

                {/* Sidebar */}
                <FieldSidebar />
            </div>

            <GenerationModal
                isOpen={isGenerationModalOpen}
                onClose={() => setIsGenerationModalOpen(false)}
                fields={fields}
                pdfUrl={pdfUrl}
                templateName={templateName}
            />
        </div>
    );
}
