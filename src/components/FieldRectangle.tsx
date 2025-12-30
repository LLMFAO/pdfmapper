'use client';

// ═══════════════════════════════════════════════════════════════════════════
// FIELD RECTANGLE COMPONENT
// Draggable, resizable field box with selection state and inline editing
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useCallback, useRef, MouseEvent, useEffect, KeyboardEvent } from 'react';
import { useTemplateStore } from '@/store/template';
import { pixelsToPercentage } from '@/lib/coordinates';
import { clamp } from '@/lib/utils';
import type { Field, PageDimensions } from '@/types';

interface FieldRectangleProps {
    field: Field;
    pixelRect: { x: number; y: number; w: number; h: number };
    isSelected: boolean;
    pageDimensions: PageDimensions;
}

type DragMode = 'none' | 'move' | 'resize-nw' | 'resize-ne' | 'resize-sw' | 'resize-se';

const MIN_SIZE = 20; // Minimum size in pixels

export function FieldRectangle({
    field,
    pixelRect,
    isSelected,
    pageDimensions,
}: FieldRectangleProps) {
    const { setSelectedFieldId, updateField } = useTemplateStore();

    const [dragMode, setDragMode] = useState<DragMode>('none');
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [initialRect, setInitialRect] = useState(pixelRect);
    const [isEditing, setIsEditing] = useState(false);
    const [editingKey, setEditingKey] = useState(field.key);
    const rectRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleClick = useCallback((e: MouseEvent) => {
        e.stopPropagation();
        setSelectedFieldId(field.id);
    }, [field.id, setSelectedFieldId]);

    const handleMouseDown = useCallback((e: MouseEvent, mode: DragMode) => {
        // Don't start dragging if editing
        if (isEditing) return;

        e.stopPropagation();
        e.preventDefault();

        setDragMode(mode);
        setDragStart({ x: e.clientX, y: e.clientY });
        setInitialRect(pixelRect);
        setSelectedFieldId(field.id);
    }, [pixelRect, field.id, setSelectedFieldId, isEditing]);

    // Start editing on double-click
    const handleDoubleClick = useCallback((e: MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        setIsEditing(true);
        setEditingKey(field.key);
    }, [field.key]);

    // Save editing
    const handleSaveEdit = useCallback(() => {
        if (editingKey.trim()) {
            updateField(field.id, { key: editingKey.trim() });
        }
        setIsEditing(false);
    }, [editingKey, field.id, updateField]);

    // Cancel editing
    const handleCancelEdit = useCallback(() => {
        setEditingKey(field.key);
        setIsEditing(false);
    }, [field.key]);

    // Handle keyboard in edit mode
    const handleKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSaveEdit();
        } else if (e.key === 'Escape') {
            handleCancelEdit();
        }
    }, [handleSaveEdit, handleCancelEdit]);

    // Focus input when editing starts
    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    // Global mouse move/up handlers for dragging
    useEffect(() => {
        if (dragMode === 'none') return;

        const handleMouseMove = (e: globalThis.MouseEvent) => {
            const deltaX = e.clientX - dragStart.x;
            const deltaY = e.clientY - dragStart.y;

            let newRect = { ...initialRect };

            if (dragMode === 'move') {
                newRect.x = clamp(initialRect.x + deltaX, 0, pageDimensions.width - initialRect.w);
                newRect.y = clamp(initialRect.y + deltaY, 0, pageDimensions.height - initialRect.h);
            } else if (dragMode === 'resize-se') {
                newRect.w = clamp(initialRect.w + deltaX, MIN_SIZE, pageDimensions.width - initialRect.x);
                newRect.h = clamp(initialRect.h + deltaY, MIN_SIZE, pageDimensions.height - initialRect.y);
            } else if (dragMode === 'resize-sw') {
                const newX = clamp(initialRect.x + deltaX, 0, initialRect.x + initialRect.w - MIN_SIZE);
                newRect.w = initialRect.w + (initialRect.x - newX);
                newRect.x = newX;
                newRect.h = clamp(initialRect.h + deltaY, MIN_SIZE, pageDimensions.height - initialRect.y);
            } else if (dragMode === 'resize-ne') {
                newRect.w = clamp(initialRect.w + deltaX, MIN_SIZE, pageDimensions.width - initialRect.x);
                const newY = clamp(initialRect.y + deltaY, 0, initialRect.y + initialRect.h - MIN_SIZE);
                newRect.h = initialRect.h + (initialRect.y - newY);
                newRect.y = newY;
            } else if (dragMode === 'resize-nw') {
                const newX = clamp(initialRect.x + deltaX, 0, initialRect.x + initialRect.w - MIN_SIZE);
                const newY = clamp(initialRect.y + deltaY, 0, initialRect.y + initialRect.h - MIN_SIZE);
                newRect.w = initialRect.w + (initialRect.x - newX);
                newRect.h = initialRect.h + (initialRect.y - newY);
                newRect.x = newX;
                newRect.y = newY;
            }

            // Update field with new percentage rect
            const percentRect = pixelsToPercentage(newRect, pageDimensions);
            updateField(field.id, { rect: percentRect });
        };

        const handleMouseUp = () => {
            setDragMode('none');
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [dragMode, dragStart, initialRect, pageDimensions, field.id, updateField]);

    return (
        <div
            ref={rectRef}
            className={`field-rect ${isSelected ? 'selected' : ''}`}
            style={{
                left: pixelRect.x,
                top: pixelRect.y,
                width: pixelRect.w,
                height: pixelRect.h,
            }}
            onClick={handleClick}
            onMouseDown={(e) => handleMouseDown(e, 'move')}
            onDoubleClick={handleDoubleClick}
        >
            {/* Field label */}
            {isEditing ? (
                <input
                    ref={inputRef}
                    type="text"
                    value={editingKey}
                    onChange={(e) => setEditingKey(e.target.value)}
                    onBlur={handleSaveEdit}
                    onKeyDown={handleKeyDown}
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    className="absolute -top-6 left-0 px-1 py-0.5 font-mono text-[9px] font-medium uppercase tracking-wide bg-[var(--color-void)] text-electric border border-electric outline-none min-w-[60px]"
                    style={{ letterSpacing: '0.05em' }}
                />
            ) : (
                <div
                    className="field-rect-label cursor-pointer hover:bg-[var(--color-electric-dim)]"
                    title="Double-click to rename"
                >
                    {field.key}
                </div>
            )}

            {/* Resize handles (only show when selected and not editing) */}
            {isSelected && !isEditing && (
                <>
                    <div
                        className="resize-handle nw"
                        onMouseDown={(e) => handleMouseDown(e, 'resize-nw')}
                    />
                    <div
                        className="resize-handle ne"
                        onMouseDown={(e) => handleMouseDown(e, 'resize-ne')}
                    />
                    <div
                        className="resize-handle sw"
                        onMouseDown={(e) => handleMouseDown(e, 'resize-sw')}
                    />
                    <div
                        className="resize-handle se"
                        onMouseDown={(e) => handleMouseDown(e, 'resize-se')}
                    />
                </>
            )}
        </div>
    );
}
