'use client';

// ═══════════════════════════════════════════════════════════════════════════
// FIELD OVERLAY COMPONENT
// Transparent layer for drawing and interacting with field rectangles
// ═══════════════════════════════════════════════════════════════════════════

import { useCallback, useRef, MouseEvent } from 'react';
import { useTemplateStore } from '@/store/template';
import { pixelsToPercentage, normalizeRect, isValidFieldSize, percentageToPixels } from '@/lib/coordinates';
import { generateId } from '@/lib/utils';
import { FieldRectangle } from './FieldRectangle';

interface FieldOverlayProps {
    pageNumber: number;
}

export function FieldOverlay({ pageNumber }: FieldOverlayProps) {
    const overlayRef = useRef<HTMLDivElement>(null);

    const {
        fields,
        addField,
        drawingState,
        setDrawingState,
        resetDrawingState,
        pageDimensions,
        selectedFieldId,
        setSelectedFieldId,
    } = useTemplateStore();

    const dimensions = pageDimensions.get(pageNumber);

    // Get mouse position relative to overlay
    const getRelativePosition = useCallback((e: MouseEvent<HTMLDivElement>) => {
        if (!overlayRef.current) return { x: 0, y: 0 };

        const rect = overlayRef.current.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        };
    }, []);

    const handleMouseDown = useCallback((e: MouseEvent<HTMLDivElement>) => {
        // Don't start drawing if clicking on an existing field
        if ((e.target as HTMLElement).closest('.field-rect')) {
            return;
        }

        const pos = getRelativePosition(e);
        setDrawingState({
            isDrawing: true,
            startX: pos.x,
            startY: pos.y,
            currentX: pos.x,
            currentY: pos.y,
            pageNumber,
        });

        // Deselect any selected field
        setSelectedFieldId(null);
    }, [getRelativePosition, pageNumber, setDrawingState, setSelectedFieldId]);

    const handleMouseMove = useCallback((e: MouseEvent<HTMLDivElement>) => {
        if (!drawingState.isDrawing || drawingState.pageNumber !== pageNumber) {
            return;
        }

        const pos = getRelativePosition(e);
        setDrawingState({
            currentX: pos.x,
            currentY: pos.y,
        });
    }, [drawingState.isDrawing, drawingState.pageNumber, pageNumber, getRelativePosition, setDrawingState]);

    const handleMouseUp = useCallback(() => {
        if (!drawingState.isDrawing || drawingState.pageNumber !== pageNumber || !dimensions) {
            resetDrawingState();
            return;
        }

        // Calculate the normalized rectangle
        const pixelRect = normalizeRect(
            drawingState.startX,
            drawingState.startY,
            drawingState.currentX,
            drawingState.currentY
        );

        // Convert to percentage
        const percentRect = pixelsToPercentage(pixelRect, dimensions);

        // Check if it's a valid size
        if (isValidFieldSize(percentRect)) {
            // Create new field
            const newField = {
                id: generateId(),
                key: `field_${fields.length + 1}`,
                type: 'text' as const,
                page_number: pageNumber,
                rect: percentRect,
            };

            addField(newField);
            setSelectedFieldId(newField.id);
        }

        resetDrawingState();
    }, [
        drawingState,
        pageNumber,
        dimensions,
        fields.length,
        addField,
        setSelectedFieldId,
        resetDrawingState,
    ]);

    const handleMouseLeave = useCallback(() => {
        if (drawingState.isDrawing) {
            resetDrawingState();
        }
    }, [drawingState.isDrawing, resetDrawingState]);

    // Get fields for this page
    const pageFields = fields.filter((f) => f.page_number === pageNumber);

    // Calculate drawing preview rect
    const drawingPreviewRect = drawingState.isDrawing && drawingState.pageNumber === pageNumber
        ? normalizeRect(
            drawingState.startX,
            drawingState.startY,
            drawingState.currentX,
            drawingState.currentY
        )
        : null;

    return (
        <div
            ref={overlayRef}
            className="field-overlay"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
        >
            {/* Existing fields */}
            {pageFields.map((field) => {
                if (!dimensions) return null;

                const pixelRect = percentageToPixels(field.rect, dimensions);

                return (
                    <FieldRectangle
                        key={field.id}
                        field={field}
                        pixelRect={pixelRect}
                        isSelected={selectedFieldId === field.id}
                        pageDimensions={dimensions}
                    />
                );
            })}

            {/* Drawing preview */}
            {drawingPreviewRect && (
                <div
                    className="absolute border-2 border-dashed border-electric bg-electric-glow pointer-events-none"
                    style={{
                        left: drawingPreviewRect.x,
                        top: drawingPreviewRect.y,
                        width: drawingPreviewRect.w,
                        height: drawingPreviewRect.h,
                    }}
                />
            )}
        </div>
    );
}
