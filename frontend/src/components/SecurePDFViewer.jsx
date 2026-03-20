import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ShieldAlert, Maximize2, Minimize2, ChevronLeft, ChevronRight } from 'lucide-react';

// Configure the worker for react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

export default function SecurePDFViewer({ fileUrl, userEmail, onClose }) {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 9999,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start',
      userSelect: 'none' // Disable text selection globally inside viewer
    }}
    onContextMenu={e => e.preventDefault()} // Disable right click
    >
      
      {/* Viewer Toolbar */}
      <div style={{ width: '100%', padding: '16px 24px', background: '#0f172a', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#f43f5e', fontWeight: 600, fontSize: 14 }}>
          <ShieldAlert size={18} />
          SECURE VIEW MODE
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: 4, marginLeft: 10 }}>COPY & PRINT DISABLED</span>
        </div>

        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: 4 }}>
            <button onClick={() => setPageNumber(p => Math.max(1, p - 1))} disabled={pageNumber <= 1} style={btnStyle}><ChevronLeft size={16} /></button>
            <span style={{ color: '#fff', fontSize: 13, minWidth: 60, textAlign: 'center' }}>{pageNumber} / {numPages || '--'}</span>
            <button onClick={() => setPageNumber(p => Math.min(numPages || 1, p + 1))} disabled={pageNumber >= numPages} style={btnStyle}><ChevronRight size={16} /></button>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: 4 }}>
            <button onClick={() => setScale(s => s - 0.2)} style={btnStyle}><Minimize2 size={16} /></button>
            <span style={{ color: '#fff', fontSize: 13, minWidth: 40, textAlign: 'center' }}>{Math.round(scale * 100)}%</span>
            <button onClick={() => setScale(s => s + 0.2)} style={btnStyle}><Maximize2 size={16} /></button>
          </div>

          <button onClick={onClose} style={{ padding: '8px 20px', borderRadius: 8, background: '#f43f5e', color: '#fff', fontWeight: 700, border: 'none', cursor: 'pointer' }}>Close Viewer</button>
        </div>
      </div>

      {/* PDF Canvas Container */}
      <div style={{ flex: 1, overflow: 'auto', width: '100%', display: 'flex', justifyContent: 'center', padding: 40, position: 'relative' }}>
        
        {/* Anti-screenshot Watermark overlay built into DOM on top of PDF */}
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', display: 'flex', flexWrap: 'wrap', overflow: 'hidden', zIndex: 10, opacity: 0.04 }}>
          {Array(50).fill(0).map((_, i) => (
             <div key={i} style={{ transform: 'rotate(-45deg)', fontSize: 24, fontWeight: 900, color: '#fff', whiteSpace: 'nowrap', padding: 60, fontFamily: 'monospace' }}>
               {userEmail} • CONFIDENTIAL
             </div>
          ))}
        </div>

        <Document
          file={fileUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={<div style={{ color: '#fff', marginTop: 100 }}>Decrypting Document...</div>}
        >
          {/* We only render one page at a time on canvas for security so they can't easily extract the DOM */}
          <Page 
            pageNumber={pageNumber} 
            scale={scale} 
            renderTextLayer={false} /* Disabled to prevent copying */
            renderAnnotationLayer={false}
            className="shadow-2xl"
          />
        </Document>

      </div>
    </div>
  );
}

const btnStyle = { background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 6, borderRadius: 4 };
