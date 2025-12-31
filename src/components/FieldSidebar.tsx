'use client';

// ═══════════════════════════════════════════════════════════════════════════
// FIELD SIDEBAR COMPONENT
// Lists all fields and allows editing properties including dimensions
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useCallback, useMemo } from 'react';
import { Trash2, Type, Calendar, CheckSquare, Edit2, Check, X, Move, Maximize2, Download, Upload } from 'lucide-react';
import { useTemplateStore } from '@/store/template';
import type { Field, FieldType, FieldRect } from '@/types';
import { downloadJson, readJsonFile } from '@/lib/utils';
import { toast } from 'sonner';

const TYPE_ICONS: Record<FieldType, typeof Type> = {
    text: Type,
    date: Calendar,
    checkbox: CheckSquare,
};

const TYPE_LABELS: Record<FieldType, string> = {
    text: 'Text',
    date: 'Date',
    checkbox: 'Checkbox',
};

export function FieldSidebar() {
    const {
        fields,
        selectedFieldId,
        setSelectedFieldId,
        updateField,
        removeField,
        templateName,
        setTemplateName,
        setFields,
    } = useTemplateStore();

    const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
    const [editingKey, setEditingKey] = useState('');
    const [isEditingName, setIsEditingName] = useState(false);
    const [editingName, setEditingName] = useState('');

    // Get the currently selected field
    const selectedField = useMemo(() =>
        fields.find(f => f.id === selectedFieldId),
        [fields, selectedFieldId]
    );

    const handleSelectField = useCallback((fieldId: string) => {
        setSelectedFieldId(fieldId);
    }, [setSelectedFieldId]);

    const handleStartEdit = useCallback((field: Field) => {
        setEditingFieldId(field.id);
        setEditingKey(field.key);
    }, []);

    const handleSaveEdit = useCallback(() => {
        if (editingFieldId && editingKey.trim()) {
            updateField(editingFieldId, { key: editingKey.trim() });
        }
        setEditingFieldId(null);
        setEditingKey('');
    }, [editingFieldId, editingKey, updateField]);

    const handleCancelEdit = useCallback(() => {
        setEditingFieldId(null);
        setEditingKey('');
    }, []);

    const handleTypeChange = useCallback((fieldId: string, type: FieldType) => {
        updateField(fieldId, { type });
    }, [updateField]);

    const handleDelete = useCallback((fieldId: string) => {
        removeField(fieldId);
        if (editingFieldId === fieldId) {
            setEditingFieldId(null);
        }
    }, [removeField, editingFieldId]);

    const handleStartEditName = useCallback(() => {
        setIsEditingName(true);
        setEditingName(templateName);
    }, [templateName]);

    const handleSaveName = useCallback(() => {
        if (editingName.trim()) {
            setTemplateName(editingName.trim());
        }
        setIsEditingName(false);
    }, [editingName, setTemplateName]);

    // Handle dimension/position changes
    const handleRectChange = useCallback((property: keyof FieldRect, value: string) => {
        if (!selectedFieldId || !selectedField) return;

        // Parse percentage value (user enters 0-100, we store 0-1)
        const numValue = parseFloat(value);
        if (isNaN(numValue)) return;

        // Clamp to valid range
        const clampedValue = Math.max(0, Math.min(100, numValue)) / 100;

        const newRect = { ...selectedField.rect, [property]: clampedValue };

        // Ensure position + size doesn't exceed 100%
        if (property === 'x' && newRect.x + newRect.w > 1) {
            newRect.w = 1 - newRect.x;
        }
        if (property === 'y' && newRect.y + newRect.h > 1) {
            newRect.h = 1 - newRect.y;
        }
        if (property === 'w' && newRect.x + newRect.w > 1) {
            newRect.x = 1 - newRect.w;
        }
        if (property === 'h' && newRect.y + newRect.h > 1) {
            newRect.y = 1 - newRect.h;
        }

        updateField(selectedFieldId, { rect: newRect });
    }, [selectedFieldId, selectedField, updateField]);

    // Copy dimensions from one field to others
    const handleApplyToAll = useCallback((property: 'w' | 'h' | 'both') => {
        if (!selectedField) return;

        const samePage = fields.filter(f => f.page_number === selectedField.page_number && f.id !== selectedField.id);

        samePage.forEach(field => {
            const updates: Partial<FieldRect> = {};
            if (property === 'w' || property === 'both') {
                updates.w = selectedField.rect.w;
            }
            if (property === 'h' || property === 'both') {
                updates.h = selectedField.rect.h;
            }
            updateField(field.id, { rect: { ...field.rect, ...updates } });
        });
    }, [selectedField, fields, updateField]);

    // Group fields by page
    const fieldsByPage = fields.reduce((acc, field) => {
        const page = field.page_number;
        if (!acc[page]) acc[page] = [];
        acc[page].push(field);
        return acc;
    }, {} as Record<number, Field[]>);

    const pageNumbers = Object.keys(fieldsByPage).map(Number).sort((a, b) => a - b);

    // Export Template
    const handleExport = () => {
        if (!fields.length) {
            toast.error('No fields to export');
            return;
        }

        const exportData = {
            name: templateName || 'Untitled Template',
            created_at: new Date().toISOString(),
            version: '1.0.0',
            fields: fields,
        };

        const baseName = (templateName || 'untitled').toLowerCase().replace(/\s+/g, '_');
        const filename = `${baseName}.template.json`;
        downloadJson(exportData, filename);
        toast.success('Template exported successfully');
    };

    // Import Template
    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            // Reset value so same file can be selected again
            e.target.value = '';

            const data = await readJsonFile<{ name: string; fields: Field[] }>(file);

            if (!Array.isArray(data.fields)) {
                throw new Error('Invalid template format: missing fields array');
            }

            if (data.name) setTemplateName(data.name);

            setFields(data.fields);
            toast.success('Template imported successfully');

        } catch (error) {
            console.error(error);
            toast.error('Failed to import template');
        }
    };


    return (
        <div className="sidebar flex flex-col">
            {/* Header with template name */}
            <div className="sidebar-header">
                <div className="flex items-center justify-between mb-2">
                    <span className="sidebar-title">Template Name</span>
                    <div className="flex gap-1">
                        <label className="text-steel hover:text-bone p-1 cursor-pointer transition-colors" title="Import Template">
                            <Upload className="w-3.5 h-3.5" />
                            <input
                                type="file"
                                className="hidden"
                                accept=".json"
                                onChange={handleImport}
                            />
                        </label>
                        <button
                            onClick={handleExport}
                            className="text-steel hover:text-bone p-1 transition-colors"
                            title="Export Template"
                        >
                            <Download className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>

                {isEditingName ? (
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            className="input text-sm py-1.5"
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveName();
                                if (e.key === 'Escape') setIsEditingName(false);
                            }}
                        />
                        <button onClick={handleSaveName} className="text-[var(--color-success)] p-1">
                            <Check className="w-4 h-4" />
                        </button>
                        <button onClick={() => setIsEditingName(false)} className="text-steel p-1">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={handleStartEditName}
                        className="flex items-center gap-2 text-bone hover:text-electric transition-colors w-full text-left"
                    >
                        <span className="font-mono text-sm truncate flex-1">
                            {templateName || 'Untitled Template'}
                        </span>
                        <Edit2 className="w-3 h-3 text-steel" />
                    </button>
                )}
            </div>

            {/* Field Properties Panel - shows when a field is selected */}
            {selectedField && (
                <div className="border-t border-graphite bg-charcoal">
                    <div className="px-5 py-3 border-b border-graphite">
                        <div className="flex items-center justify-between">
                            <span className="sidebar-title">Field Properties</span>
                            <span className="font-mono text-[10px] text-electric">{selectedField.key}</span>
                        </div>
                    </div>

                    <div className="p-4 space-y-4">
                        {/* Name */}
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Edit2 className="w-3 h-3 text-steel" />
                                <span className="font-mono text-[10px] text-steel uppercase tracking-wider">Name</span>
                            </div>
                            <input
                                type="text"
                                value={editingFieldId === selectedField.id ? editingKey : selectedField.key}
                                onChange={(e) => {
                                    if (editingFieldId !== selectedField.id) {
                                        setEditingFieldId(selectedField.id);
                                        setEditingKey(e.target.value);
                                    } else {
                                        setEditingKey(e.target.value);
                                    }
                                }}
                                onBlur={() => {
                                    if (editingFieldId === selectedField.id && editingKey.trim()) {
                                        updateField(selectedField.id, { key: editingKey.trim() });
                                    }
                                    setEditingFieldId(null);
                                    setEditingKey('');
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        if (editingFieldId === selectedField.id && editingKey.trim()) {
                                            updateField(selectedField.id, { key: editingKey.trim() });
                                        }
                                        setEditingFieldId(null);
                                        setEditingKey('');
                                    }
                                }}
                                className="input text-xs py-1.5 w-full"
                                placeholder="field_name"
                            />
                        </div>

                        {/* Font Size (Text Only) */}
                        {selectedField.type === 'text' && (
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <Type className="w-3 h-3 text-steel" />
                                    <span className="font-mono text-[10px] text-steel uppercase tracking-wider">Font Size</span>
                                </div>
                                <div className="flex bg-void rounded border border-graphite p-0.5">
                                    {(['small', 'medium', 'large'] as const).map((size) => (
                                        <button
                                            key={size}
                                            onClick={() => updateField(selectedField.id, { fontSize: size })}
                                            className={`flex-1 text-[10px] py-1 font-mono transition-colors ${(selectedField.fontSize || 'medium') === size
                                                    ? 'bg-charcoal text-electric shadow-sm'
                                                    : 'text-steel hover:text-bone'
                                                }`}
                                        >
                                            {size.charAt(0).toUpperCase() + size.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Position */}
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Move className="w-3 h-3 text-steel" />
                                <span className="font-mono text-[10px] text-steel uppercase tracking-wider">Position (%)</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="input-label">X</label>
                                    <input
                                        type="number"
                                        value={(selectedField.rect.x * 100).toFixed(1)}
                                        onChange={(e) => handleRectChange('x', e.target.value)}
                                        className="input text-xs py-1.5"
                                        min="0"
                                        max="100"
                                        step="0.5"
                                    />
                                </div>
                                <div>
                                    <label className="input-label">Y</label>
                                    <input
                                        type="number"
                                        value={(selectedField.rect.y * 100).toFixed(1)}
                                        onChange={(e) => handleRectChange('y', e.target.value)}
                                        className="input text-xs py-1.5"
                                        min="0"
                                        max="100"
                                        step="0.5"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Size */}
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Maximize2 className="w-3 h-3 text-steel" />
                                <span className="font-mono text-[10px] text-steel uppercase tracking-wider">Size (%)</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="input-label">Width</label>
                                    <input
                                        type="number"
                                        value={(selectedField.rect.w * 100).toFixed(1)}
                                        onChange={(e) => handleRectChange('w', e.target.value)}
                                        className="input text-xs py-1.5"
                                        min="1"
                                        max="100"
                                        step="0.5"
                                    />
                                </div>
                                <div>
                                    <label className="input-label">Height</label>
                                    <input
                                        type="number"
                                        value={(selectedField.rect.h * 100).toFixed(1)}
                                        onChange={(e) => handleRectChange('h', e.target.value)}
                                        className="input text-xs py-1.5"
                                        min="1"
                                        max="100"
                                        step="0.5"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="pt-2 border-t border-graphite">
                            <span className="font-mono text-[10px] text-steel uppercase tracking-wider block mb-2">
                                Apply to All (Same Page)
                            </span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleApplyToAll('w')}
                                    className="btn btn-ghost text-[10px] py-1.5 px-2 flex-1"
                                    title="Apply this width to all fields on this page"
                                >
                                    Width
                                </button>
                                <button
                                    onClick={() => handleApplyToAll('h')}
                                    className="btn btn-ghost text-[10px] py-1.5 px-2 flex-1"
                                    title="Apply this height to all fields on this page"
                                >
                                    Height
                                </button>
                                <button
                                    onClick={() => handleApplyToAll('both')}
                                    className="btn btn-ghost text-[10px] py-1.5 px-2 flex-1"
                                    title="Apply both dimensions to all fields on this page"
                                >
                                    Both
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Fields section */}
            <div className="sidebar-header border-t border-graphite">
                <div className="flex items-center justify-between">
                    <span className="sidebar-title">Fields</span>
                    <span className="font-mono text-xs text-steel">{fields.length}</span>
                </div>
            </div>

            {/* Field list */}
            <div className="flex-1 overflow-y-auto">
                {fields.length === 0 ? (
                    <div className="p-6 text-center">
                        <p className="font-mono text-xs text-steel">
                            Draw on the PDF to create fields
                        </p>
                    </div>
                ) : (
                    pageNumbers.map((pageNum) => (
                        <div key={pageNum}>
                            <div className="px-5 py-2 bg-charcoal border-b border-graphite">
                                <span className="font-mono text-[10px] text-steel uppercase tracking-wider">
                                    Page {pageNum}
                                </span>
                            </div>

                            {fieldsByPage[pageNum].map((field) => {
                                const isEditing = editingFieldId === field.id;
                                const isSelected = selectedFieldId === field.id;

                                return (
                                    <div
                                        key={field.id}
                                        className={`field-list-item group ${isSelected ? 'active' : ''}`}
                                        onClick={() => handleSelectField(field.id)}
                                    >
                                        <div className="flex-1 min-w-0">
                                            {isEditing ? (
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="text"
                                                        value={editingKey}
                                                        onChange={(e) => setEditingKey(e.target.value)}
                                                        className="input text-xs py-1"
                                                        autoFocus
                                                        onClick={(e) => e.stopPropagation()}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') handleSaveEdit();
                                                            if (e.key === 'Escape') handleCancelEdit();
                                                        }}
                                                        onBlur={handleSaveEdit}
                                                    />
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleSaveEdit(); }}
                                                        className="text-[var(--color-success)] p-1 hover:bg-graphite"
                                                    >
                                                        <Check className="w-3 h-3" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleCancelEdit(); }}
                                                        className="text-steel p-1 hover:bg-graphite"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <span
                                                        className="field-key truncate cursor-pointer hover:text-bone"
                                                        onDoubleClick={(e) => { e.stopPropagation(); handleStartEdit(field); }}
                                                        title="Double-click to rename"
                                                    >
                                                        {field.key}
                                                    </span>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleStartEdit(field); }}
                                                        className="text-steel hover:text-electric p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        title="Rename field"
                                                    >
                                                        <Edit2 className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Type selector */}
                                        <div className="flex items-center gap-1">
                                            {(['text', 'date', 'checkbox'] as FieldType[]).map((type) => {
                                                const Icon = TYPE_ICONS[type];
                                                const isActive = field.type === type;
                                                return (
                                                    <button
                                                        key={type}
                                                        onClick={(e) => { e.stopPropagation(); handleTypeChange(field.id, type); }}
                                                        className={`p-1.5 transition-colors ${isActive
                                                            ? 'text-electric bg-graphite'
                                                            : 'text-steel hover:text-bone'
                                                            }`}
                                                        title={TYPE_LABELS[type]}
                                                    >
                                                        <Icon className="w-3 h-3" />
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        {/* Delete button */}
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDelete(field.id); }}
                                            className="text-steel hover:text-[var(--color-danger)] p-1 transition-colors"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
