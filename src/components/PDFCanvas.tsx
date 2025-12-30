'use client';

// ═══════════════════════════════════════════════════════════════════════════
// PDF CANVAS COMPONENT
// Renders PDF pages with overlaid field drawing layer
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useCallback, useRef, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useTemplateStore } from '@/store/template';
import { FieldOverlay } from './FieldOverlay';

// Dynamically import react-pdf components with SSR disabled
const Document = dynamic(
    () => import('react-pdf').then((mod) => mod.Document),
    { ssr: false }
);

const Page = dynamic(
    () => import('react-pdf').then((mod) => mod.Page),
    { ssr: false }
);

interface PDFCanvasProps {
    className?: string;
}

export function PDFCanvas({ className = '' }: PDFCanvasProps) {
    const { pdfUrl, pageCount, setPageDimensions } = useTemplateStore();
    const [loadedPages, setLoadedPages] = useState<Set<number>>(new Set());
    const [isConfigured, setIsConfigured] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = useState<number>(0);

    // Configure pdfjs worker on mount
    useEffect(() => {
        const configurePdfjs = async () => {
            try {
                const { pdfjs } = await import('react-pdf');
                pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
                setIsConfigured(true);
            } catch (err) {
                console.error('Failed to configure pdfjs:', err);
            }
        };

        configurePdfjs();
    }, []);

    // Track container width for responsive scaling
    useEffect(() => {
        const updateWidth = () => {
            if (containerRef.current) {
                // Account for sidebar (320px) and some padding
                const availableWidth = containerRef.current.clientWidth;
                setContainerWidth(Math.min(availableWidth, 800)); // Max 800px for readability
            }
        };

        updateWidth();
        window.addEventListener('resize', updateWidth);
        return () => window.removeEventListener('resize', updateWidth);
    }, []);

    const handlePageLoadSuccess = useCallback((pageNumber: number, width: number, height: number) => {
        setLoadedPages((prev) => new Set([...prev, pageNumber]));
        setPageDimensions(pageNumber, { width, height });
    }, [setPageDimensions]);

    if (!pdfUrl) {
        return null;
    }

    if (!isConfigured) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-electric animate-spin" />
            </div>
        );
    }

    return (
        <div ref={containerRef} className={`flex flex-col items-center gap-8 ${className}`}>
            <Document
                file={pdfUrl}
                loading={
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 text-electric animate-spin" />
                    </div>
                }
                error={
                    <div className="panel p-8 text-center">
                        <p className="font-mono text-sm text-[var(--color-danger)]">
                            Failed to load PDF
                        </p>
                    </div>
                }
            >
                {Array.from({ length: pageCount }, (_, index) => {
                    const pageNumber = index + 1;
                    return (
                        <div
                            key={pageNumber}
                            className="pdf-page-container mb-8"
                            style={{ maxWidth: containerWidth || 'auto' }}
                        >
                            {/* Page number indicator */}
                            <div className="absolute -top-6 left-0 font-mono text-xs text-steel">
                                Page {pageNumber} of {pageCount}
                            </div>

                            {/* PDF Page */}
                            <Page
                                pageNumber={pageNumber}
                                width={containerWidth || undefined}
                                onLoadSuccess={(page) => handlePageLoadSuccess(
                                    pageNumber,
                                    page.width,
                                    page.height,
                                )}
                                loading={
                                    <div className="flex items-center justify-center" style={{ height: 400 }}>
                                        <Loader2 className="w-6 h-6 text-steel animate-spin" />
                                    </div>
                                }
                                renderTextLayer={false}
                                renderAnnotationLayer={false}
                            />

                            {/* Field overlay for drawing/editing */}
                            {loadedPages.has(pageNumber) && (
                                <FieldOverlay pageNumber={pageNumber} />
                            )}
                        </div>
                    );
                })}
            </Document>
        </div>
    );
}
