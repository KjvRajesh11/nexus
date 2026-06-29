'use client';

import React, { useState, useRef, useEffect } from 'react';
import { downloadMarkdown, downloadPdf } from '@/lib/export';
import { Message } from '@/app/page';

interface ExportButtonProps {
  messages: Message[];
}

export default function ExportButton({ messages }: ExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 12px',
          borderRadius: 8,
          border: '1px solid rgba(255,255,255,0.08)',
          background: 'transparent',
          color: '#888',
          fontSize: "var(--fs-meta)",
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          outline: 'none',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'rgba(212,168,67,0.4)';
          e.currentTarget.style.color = '#d4a843';
          e.currentTarget.style.background = 'rgba(212,168,67,0.02)';
        }}
        onMouseLeave={(e) => {
          if (!isOpen) {
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
            e.currentTarget.style.color = '#888';
            e.currentTarget.style.background = 'transparent';
          }
        }}
      >
        <span>Export</span>
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            background: '#161616',
            border: '1px solid rgba(255,255,255,0.11)',
            borderRadius: 8,
            width: 170,
            padding: 4,
            zIndex: 50,
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            animation: 'nxFade 0.18s ease forwards',
          }}
        >
          <button
            type="button"
            onClick={() => {
              downloadMarkdown(messages);
              setIsOpen(false);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '7px 10px',
              borderRadius: 6,
              fontSize: "var(--fs-meta)",
              color: '#a0a0a0',
              border: 'none',
              background: 'transparent',
              width: '100%',
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'all 0.12s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#f0f0f0';
              e.currentTarget.style.background = '#222';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#a0a0a0';
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <span style={{ fontSize: "var(--fs-heading-sm)" }}>📄</span>
            <span>Export as Markdown</span>
          </button>
          <button
            type="button"
            onClick={() => {
              downloadPdf();
              setIsOpen(false);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '7px 10px',
              borderRadius: 6,
              fontSize: "var(--fs-meta)",
              color: '#a0a0a0',
              border: 'none',
              background: 'transparent',
              width: '100%',
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'all 0.12s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#f0f0f0';
              e.currentTarget.style.background = '#222';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#a0a0a0';
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <span style={{ fontSize: "var(--fs-heading-sm)" }}>🖨️</span>
            <span>Export as PDF</span>
          </button>
        </div>
      )}
    </div>
  );
}
