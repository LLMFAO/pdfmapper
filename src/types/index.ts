// ═══════════════════════════════════════════════════════════════════════════
// PDF MAPPER - TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Field rectangle position stored as percentages (0.0 - 1.0)
 * This ensures consistency across different DPI and zoom levels
 */
export interface FieldRect {
    x: number;  // Left position as percentage of page width
    y: number;  // Top position as percentage of page height
    w: number;  // Width as percentage of page width
    h: number;  // Height as percentage of page height
}

/**
 * Field types supported for mapping
 */
export type FieldType = 'text' | 'date' | 'checkbox';

/**
 * A single field definition on the PDF template
 */
export interface Field {
    id: string;
    key: string;           // JSON key (e.g., "first_name")
    type: FieldType;
    page_number: number;   // 1-indexed
    fontSize?: 'small' | 'medium' | 'large';
    rect: FieldRect;
}

/**
 * A PDF template with its field mappings
 */
export interface Template {
    id: string;
    name: string;
    created_by: string;
    created_at: Date;
    updated_at: Date;
    gcs_path: string;
    page_count: number;
    fields: Field[];
}

/**
 * Template creation input (without auto-generated fields)
 */
export interface TemplateInput {
    name: string;
    gcs_path: string;
    page_count: number;
    fields?: Field[];
}

/**
 * Drawing state for creating new fields
 */
export interface DrawingState {
    isDrawing: boolean;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    pageNumber: number;
}

/**
 * PDF page dimensions for coordinate calculations
 */
export interface PageDimensions {
    width: number;
    height: number;
}

/**
 * Upload state for tracking file uploads
 */
export interface UploadState {
    status: 'idle' | 'validating' | 'uploading' | 'complete' | 'error';
    progress: number;
    error?: string;
    fileName?: string;
    pageCount?: number;
}

/**
 * JSON data for PDF generation
 */
export type GenerationData = Record<string, string | boolean | number | null>;
