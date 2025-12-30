'use client';

// ═══════════════════════════════════════════════════════════════════════════
// PDF MAPPER - LANDING PAGE
// Upload PDF or select existing template
// ═══════════════════════════════════════════════════════════════════════════

import { useRouter } from 'next/navigation';
import { FileText, Map, Download, ArrowRight } from 'lucide-react';
import { PDFUploader } from '@/components/PDFUploader';
import { useTemplateStore } from '@/store/template';

export default function Home() {
  const router = useRouter();
  const { pdfUrl, pageCount, templateName, resetState } = useTemplateStore();

  const handleUploadComplete = () => {
    router.push('/mapper');
  };

  const handleReset = () => {
    resetState();
  };

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="border-b border-graphite">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-electric flex items-center justify-center">
              <FileText className="w-4 h-4 text-void" />
            </div>
            <h1 className="font-mono text-sm font-bold tracking-wider text-bone">
              PDF MAPPER
            </h1>
          </div>

          <nav className="flex items-center gap-4">
            <a href="/generate" className="btn btn-ghost text-xs">
              <Download className="w-4 h-4" />
              Generate
            </a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-bone mb-4 leading-tight">
            Map PDF Fields.<br />
            <span className="text-electric">Inject Data.</span><br />
            Generate Documents.
          </h2>

          <p className="font-mono text-sm text-steel max-w-xl mx-auto mb-12">
            Upload a PDF, draw drop zones for your data fields,
            then inject JSON to generate filled documents automatically.
          </p>

          {/* Workflow Diagram */}
          <div className="flex items-center justify-center gap-4 mb-16">
            {[
              { icon: FileText, label: 'Upload PDF' },
              { icon: Map, label: 'Map Fields' },
              { icon: Download, label: 'Generate' },
            ].map((step, i) => (
              <div key={step.label} className="flex items-center gap-4">
                <div className="flex flex-col items-center gap-2">
                  <div className="panel w-16 h-16 flex items-center justify-center">
                    <step.icon className="w-6 h-6 text-electric" />
                  </div>
                  <span className="font-mono text-[10px] text-steel uppercase tracking-wider">
                    {step.label}
                  </span>
                </div>
                {i < 2 && (
                  <ArrowRight className="w-5 h-5 text-slate" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Upload Section */}
      <section className="py-12 px-6 bg-obsidian border-y border-graphite">
        <div className="max-w-4xl mx-auto">
          {pdfUrl ? (
            <div className="panel p-8 text-center">
              <FileText className="w-12 h-12 text-success mx-auto mb-4" />
              <h3 className="font-mono text-lg text-bone mb-2">{templateName}</h3>
              <p className="font-mono text-sm text-steel mb-6">
                {pageCount} page{pageCount > 1 ? 's' : ''} • Ready to map
              </p>
              <div className="flex items-center justify-center gap-4">
                <button onClick={handleReset} className="btn btn-ghost">
                  Upload Different
                </button>
                <button onClick={() => router.push('/mapper')} className="btn btn-primary">
                  Continue to Mapper
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <>
              <h3 className="font-mono text-xs text-steel uppercase tracking-wider text-center mb-6">
                Start by uploading a PDF
              </h3>
              <PDFUploader onUploadComplete={handleUploadComplete} />
            </>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <h3 className="font-mono text-xs text-steel uppercase tracking-wider text-center mb-12">
            How it works
          </h3>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: 'Visual Field Mapping',
                description: 'Draw rectangles directly on your PDF to define where data should appear. Resize and reposition with precision.',
              },
              {
                title: 'JSON Data Injection',
                description: 'Paste any JSON object and watch it populate your template. Field keys match your mapped labels automatically.',
              },
              {
                title: 'Percentage Coordinates',
                description: 'Fields are stored as percentages, ensuring consistent placement regardless of zoom level or screen DPI.',
              },
            ].map((feature) => (
              <div key={feature.title} className="panel p-6">
                <h4 className="font-mono text-sm font-bold text-bone mb-2">
                  {feature.title}
                </h4>
                <p className="font-mono text-xs text-steel leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-graphite py-6 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <span className="font-mono text-xs text-steel">
            Open Source PDF Mapper
          </span>
          <span className="font-mono text-xs text-steel">
            Built with Next.js + Python
          </span>
        </div>
      </footer>
    </main>
  );
}
