'use client';

// ═══════════════════════════════════════════════════════════════════════════
// PDF UPLOADER COMPONENT
// Drag-and-drop upload with validation and page count extraction
// ═══════════════════════════════════════════════════════════════════════════

import { useCallback, useState, useEffect, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { validatePdfFile } from '@/lib/utils';
import { useTemplateStore } from '@/store/template';

const MAX_PAGES = 10;

interface PDFUploaderProps {
    onUploadComplete?: () => void;
}

export function PDFUploader({ onUploadComplete }: PDFUploaderProps) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isReady, setIsReady] = useState(false);
    const pdfjsRef = useRef<typeof import('pdfjs-dist') | null>(null);

    const { setPdfFile, setPageCount, setTemplateName } = useTemplateStore();

    // Load pdfjs dynamically on mount
    useEffect(() => {
        const loadPdfjs = async () => {
            try {
                const pdfjs = await import('pdfjs-dist');
                pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
                pdfjsRef.current = pdfjs;
                setIsReady(true);
            } catch (err) {
                console.error('Failed to load pdfjs:', err);
                setError('Failed to initialize PDF processor');
            }
        };

        loadPdfjs();
    }, []);

    const processFile = useCallback(async (file: File) => {
        if (!pdfjsRef.current) {
            toast.error('PDF processor not ready');
            return;
        }

        setIsProcessing(true);
        setError(null);

        try {
            // Validate file
            const validationError = await validatePdfFile(file);
            if (validationError) {
                setError(validationError);
                toast.error(validationError);
                return;
            }

            // Count pages using PDF.js
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsRef.current.getDocument({ data: arrayBuffer }).promise;
            const numPages = pdf.numPages;

            // Check page limit
            if (numPages > MAX_PAGES) {
                const msg = `PDF has ${numPages} pages. Maximum allowed is ${MAX_PAGES}.`;
                setError(msg);
                toast.error(msg);
                return;
            }

            // Store the file and page count
            setPdfFile(file);
            setPageCount(numPages);
            setTemplateName(file.name.replace(/\.pdf$/i, ''));

            toast.success(`PDF loaded: ${numPages} page${numPages > 1 ? 's' : ''}`);
            onUploadComplete?.();

        } catch (err) {
            console.error('PDF processing error:', err);
            const msg = 'Failed to process PDF file';
            setError(msg);
            toast.error(msg);
        } finally {
            setIsProcessing(false);
        }
    }, [setPdfFile, setPageCount, setTemplateName, onUploadComplete]);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (file) {
            processFile(file);
        }
    }, [processFile]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
        },
        maxFiles: 1,
        disabled: isProcessing || !isReady,
    });

    return (
        <div className="w-full max-w-2xl mx-auto">
            <div
                {...getRootProps()}
                className={`dropzone ${isDragActive ? 'active' : ''} ${isProcessing || !isReady ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                <input {...getInputProps()} />

                {!isReady ? (
                    <>
                        <Loader2 className="w-12 h-12 text-steel mb-4 animate-spin" />
                        <p className="font-mono text-sm text-steel">Initializing...</p>
                    </>
                ) : isProcessing ? (
                    <>
                        <Loader2 className="w-12 h-12 text-electric mb-4 animate-spin" />
                        <p className="font-mono text-sm text-bone">Processing PDF...</p>
                    </>
                ) : error ? (
                    <>
                        <AlertCircle className="w-12 h-12 text-[var(--color-danger)] mb-4" />
                        <p className="font-mono text-sm text-[var(--color-danger)] mb-2">{error}</p>
                        <p className="font-mono text-xs text-steel">Click or drop to try again</p>
                    </>
                ) : isDragActive ? (
                    <>
                        <FileText className="w-12 h-12 text-electric mb-4" />
                        <p className="font-mono text-sm text-electric">Drop PDF here</p>
                    </>
                ) : (
                    <>
                        <Upload className="w-12 h-12 text-steel mb-4" />
                        <p className="font-mono text-sm text-bone mb-2">
                            Drop your PDF here or click to browse
                        </p>
                        <p className="font-mono text-xs text-steel">
                            Max {MAX_PAGES} pages • Max 10MB
                        </p>
                    </>
                )}
            </div>

            {/* Constraints info */}
            <div className="mt-4 flex justify-center gap-6">
                <div className="flex items-center gap-2 text-steel">
                    <FileText className="w-4 h-4" />
                    <span className="font-mono text-xs">PDF only</span>
                </div>
                <div className="flex items-center gap-2 text-steel">
                    <span className="font-mono text-xs">≤ 10 pages</span>
                </div>
                <div className="flex items-center gap-2 text-steel">
                    <span className="font-mono text-xs">≤ 10MB</span>
                </div>
            </div>
        </div>
    );
}
