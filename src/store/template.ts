// ═══════════════════════════════════════════════════════════════════════════
// TEMPLATE STORE (Zustand)
// Global state management for templates and field editing
// ═══════════════════════════════════════════════════════════════════════════

import { create } from 'zustand';
import type { Field, Template, DrawingState, PageDimensions } from '@/types';

interface TemplateState {
    // Current template being edited
    currentTemplate: Template | null;
    setCurrentTemplate: (template: Template | null) => void;

    // Fields for the current template
    fields: Field[];
    addField: (field: Field) => void;
    updateField: (id: string, updates: Partial<Field>) => void;
    removeField: (id: string) => void;
    setFields: (fields: Field[]) => void;

    // Selected field for editing
    selectedFieldId: string | null;
    setSelectedFieldId: (id: string | null) => void;

    // Drawing state
    drawingState: DrawingState;
    setDrawingState: (state: Partial<DrawingState>) => void;
    resetDrawingState: () => void;

    // Page dimensions (for coordinate calculations)
    pageDimensions: Map<number, PageDimensions>;
    setPageDimensions: (pageNumber: number, dimensions: PageDimensions) => void;

    // PDF file state
    pdfFile: File | null;
    pdfUrl: string | null;
    pageCount: number;
    setPdfFile: (file: File | null) => void;
    setPageCount: (count: number) => void;

    // Template name
    templateName: string;
    setTemplateName: (name: string) => void;

    // Reset all state
    resetState: () => void;
}

const initialDrawingState: DrawingState = {
    isDrawing: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    pageNumber: 1,
};

export const useTemplateStore = create<TemplateState>((set, get) => ({
    // Template
    currentTemplate: null,
    setCurrentTemplate: (template) => set({ currentTemplate: template }),

    // Fields
    fields: [],
    addField: (field) => set((state) => ({
        fields: [...state.fields, field]
    })),
    updateField: (id, updates) => set((state) => ({
        fields: state.fields.map((f) =>
            f.id === id ? { ...f, ...updates } : f
        ),
    })),
    removeField: (id) => set((state) => ({
        fields: state.fields.filter((f) => f.id !== id),
        selectedFieldId: state.selectedFieldId === id ? null : state.selectedFieldId,
    })),
    setFields: (fields) => set({ fields }),

    // Selected field
    selectedFieldId: null,
    setSelectedFieldId: (id) => set({ selectedFieldId: id }),

    // Drawing
    drawingState: initialDrawingState,
    setDrawingState: (state) => set((prev) => ({
        drawingState: { ...prev.drawingState, ...state },
    })),
    resetDrawingState: () => set({ drawingState: initialDrawingState }),

    // Page dimensions
    pageDimensions: new Map(),
    setPageDimensions: (pageNumber, dimensions) => set((state) => {
        const newMap = new Map(state.pageDimensions);
        newMap.set(pageNumber, dimensions);
        return { pageDimensions: newMap };
    }),

    // PDF file
    pdfFile: null,
    pdfUrl: null,
    pageCount: 0,
    setPdfFile: (file) => {
        // Revoke old URL if exists
        const oldUrl = get().pdfUrl;
        if (oldUrl) {
            URL.revokeObjectURL(oldUrl);
        }

        set({
            pdfFile: file,
            pdfUrl: file ? URL.createObjectURL(file) : null,
        });
    },
    setPageCount: (count) => set({ pageCount: count }),

    // Template name
    templateName: '',
    setTemplateName: (name) => set({ templateName: name }),

    // Reset
    resetState: () => {
        const oldUrl = get().pdfUrl;
        if (oldUrl) {
            URL.revokeObjectURL(oldUrl);
        }

        set({
            currentTemplate: null,
            fields: [],
            selectedFieldId: null,
            drawingState: initialDrawingState,
            pageDimensions: new Map(),
            pdfFile: null,
            pdfUrl: null,
            pageCount: 0,
            templateName: '',
        });
    },
}));
