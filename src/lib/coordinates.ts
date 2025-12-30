// ═══════════════════════════════════════════════════════════════════════════
// COORDINATE UTILITIES
// Handles conversion between browser pixels and percentage-based storage
// ═══════════════════════════════════════════════════════════════════════════

import type { FieldRect, PageDimensions } from '@/types';

/**
 * Convert pixel coordinates to percentage-based rect
 * Used when saving field positions drawn in the browser
 */
export function pixelsToPercentage(
    pixelRect: { x: number; y: number; w: number; h: number },
    pageDimensions: PageDimensions
): FieldRect {
    return {
        x: pixelRect.x / pageDimensions.width,
        y: pixelRect.y / pageDimensions.height,
        w: pixelRect.w / pageDimensions.width,
        h: pixelRect.h / pageDimensions.height,
    };
}

/**
 * Convert percentage-based rect to pixel coordinates
 * Used when rendering fields on the browser canvas
 */
export function percentageToPixels(
    percentRect: FieldRect,
    pageDimensions: PageDimensions
): { x: number; y: number; w: number; h: number } {
    return {
        x: percentRect.x * pageDimensions.width,
        y: percentRect.y * pageDimensions.height,
        w: percentRect.w * pageDimensions.width,
        h: percentRect.h * pageDimensions.height,
    };
}

/**
 * Convert percentage-based rect to PDF coordinates
 * PDFs typically use 72 DPI, origin can be top-left or bottom-left
 * This function assumes top-left origin (PyMuPDF default)
 */
export function percentageToPDFCoords(
    percentRect: FieldRect,
    pdfPageDimensions: PageDimensions
): { x0: number; y0: number; x1: number; y1: number } {
    const x0 = percentRect.x * pdfPageDimensions.width;
    const y0 = percentRect.y * pdfPageDimensions.height;
    const x1 = (percentRect.x + percentRect.w) * pdfPageDimensions.width;
    const y1 = (percentRect.y + percentRect.h) * pdfPageDimensions.height;

    return { x0, y0, x1, y1 };
}

/**
 * Normalize a rectangle to ensure positive width/height
 * Handles cases where user draws from bottom-right to top-left
 */
export function normalizeRect(
    startX: number,
    startY: number,
    endX: number,
    endY: number
): { x: number; y: number; w: number; h: number } {
    return {
        x: Math.min(startX, endX),
        y: Math.min(startY, endY),
        w: Math.abs(endX - startX),
        h: Math.abs(endY - startY),
    };
}

/**
 * Check if a point is inside a rectangle
 */
export function isPointInRect(
    px: number,
    py: number,
    rect: { x: number; y: number; w: number; h: number }
): boolean {
    return (
        px >= rect.x &&
        px <= rect.x + rect.w &&
        py >= rect.y &&
        py <= rect.y + rect.h
    );
}

/**
 * Calculate the minimum viable field size (in percentage)
 * Fields smaller than this are likely accidental clicks
 */
export const MIN_FIELD_SIZE_PERCENT = 0.01; // 1% of page dimension

/**
 * Check if a rect is large enough to be a valid field
 */
export function isValidFieldSize(rect: FieldRect): boolean {
    return rect.w >= MIN_FIELD_SIZE_PERCENT && rect.h >= MIN_FIELD_SIZE_PERCENT;
}
