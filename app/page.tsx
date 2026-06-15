'use client'

import React, { useState, useRef, useEffect } from "react";

const C = {
  bg:"#0a0a0a", surface:"#111111", surface2:"#161616", surface3:"#1c1c1c", surface4:"#222222",
  border:"rgba(255,255,255,0.07)", border2:"rgba(255,255,255,0.11)", border3:"rgba(255,255,255,0.17)",
  text:"#f0f0f0", muted:"#5a5a5a", muted2:"#888888",
  accent:"#d4a843", accentDim:"rgba(212,168,67,0.12)", accentMid:"rgba(212,168,67,0.22)",
};

// ── All inline SVG icons — no webfont dependency ──────────────────────────────
const ICONS = {
  // nav
  chat: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  library: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
  projects: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  spaces: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><ellipse cx="12" cy="12" rx="10" ry="4"/><line x1="2" y1="12" x2="22" y2="12"/></svg>,
  history: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="12 8 12 12 14 14"/><path d="M3.05 11a9 9 0 1 1 .5 4m-.5 5v-5h5"/></svg>,
  bookmarks: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>,
  discover: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>,
  // header
  sidebarRight: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="15" y1="3" x2="15" y2="21"/></svg>,
  keyboard: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><line x1="6" y1="10" x2="6" y2="10"/><line x1="10" y1="10" x2="10" y2="10"/><line x1="14" y1="10" x2="14" y2="10"/><line x1="18" y1="10" x2="18" y2="10"/><line x1="6" y1="14" x2="18" y2="14"/></svg>,
  settings: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  user: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  // input
  paperclip: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>,
  image: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
  mic: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>,
  send: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  chevronDown: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>,
  plus: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  x: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  copy: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
  share: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>,
  refresh: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
  thumbUp: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>,
  thumbDown: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z"/><path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/></svg>,
  // sources panel
  upload: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>,
  books: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><line x1="12" y1="6" x2="16" y2="6"/><line x1="12" y1="10" x2="16" y2="10"/></svg>,
  fileText: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  globe: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
  bulb: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><line x1="9" y1="18" x2="15" y2="18"/><line x1="10" y1="22" x2="14" y2="22"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/></svg>,
  trending: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  // action tools
  headphones: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z"/><path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>,
  notebook: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>,
  faq: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  timeline: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="2" x2="12" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  video: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>,
  // input tags
  telescope: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="2"/><path d="M2 12l4-4 4 4"/><path d="M22 8l-4 4-4-4"/><line x1="12" y1="14" x2="12" y2="22"/></svg>,
  doc: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  atom: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><path d="M20.2 20.2c2.04-2.03.02-7.36-4.5-11.9-4.54-4.52-9.87-6.54-11.9-4.5-2.04 2.03-.02 7.36 4.5 11.9 4.54 4.52 9.87 6.54 11.9 4.5z"/><path d="M15.7 15.7c4.52-4.54 6.54-9.87 4.5-11.9-2.03-2.04-7.36-.02-11.9 4.5-4.52 4.54-6.54 9.87-4.5 11.9 2.03 2.04 7.36.02 11.9-4.5z"/></svg>,
  code: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>,
  cpu: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></svg>,
  // settings tabs
  adjustments: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>,
  palette: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>,
  shield: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>,
  bell: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  keyboardIco: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><line x1="6" y1="10" x2="6.01" y2="10"/><line x1="10" y1="10" x2="10.01" y2="10"/><line x1="14" y1="10" x2="14.01" y2="10"/><line x1="18" y1="10" x2="18.01" y2="10"/><line x1="6" y1="14" x2="18" y2="14"/></svg>,
  // profile menu
  crown: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z"/><line x1="5" y1="20" x2="19" y2="20"/></svg>,
  plug: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18"/><path d="M7 17l-5 5"/><path d="M17 7l5-5"/><path d="M8 21l-5-5 3-3 5 5-3 3z"/><path d="M16 3l5 5-3 3-5-5 3-3z"/></svg>,
  key: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>,
  logout: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  // recent icons
  dna: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M2 15c6.667-6 13.333 0 20-6"/><path d="M9 22c1.798-1.998 2.518-3.995 2.807-5.993"/><path d="M15 2c-1.798 2-2.518 3.995-2.807 5.993"/><path d="M2 9c6.667 6 13.333 0 20 6"/></svg>,
  brain: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-1.544-4.579A3 3 0 0 1 4 11a3 3 0 0 1 1.5-2.5A2.5 2.5 0 0 1 9.5 2"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 1.544-4.579A3 3 0 0 0 20 11a3 3 0 0 0-1.5-2.5A2.5 2.5 0 0 0 14.5 2"/></svg>,
  virus: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="8"/><line x1="12" y1="16" x2="12" y2="22"/><line x1="2" y1="12" x2="8" y2="12"/><line x1="16" y1="12" x2="22" y2="12"/><circle cx="12" cy="2" r="1" fill="currentColor"/><circle cx="12" cy="22" r="1" fill="currentColor"/><circle cx="2" cy="12" r="1" fill="currentColor"/><circle cx="22" cy="12" r="1" fill="currentColor"/></svg>,
  universe: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="4.93" y1="4.93" x2="9.17" y2="9.17"/><line x1="14.83" y1="14.83" x2="19.07" y2="19.07"/><line x1="14.83" y1="9.17" x2="19.07" y2="4.93"/><line x1="14.83" y1="9.17" x2="18.36" y2="5.64"/><line x1="4.93" y1="19.07" x2="9.17" y2="14.83"/></svg>,
};

const Ico = ({ k, size = 16, style = {} }) => (
  <span style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", width:size, height:size, flexShrink:0, ...style }}>
    {ICONS[k] ? <svg {...ICONS[k].props} style={{ width:"100%", height:"100%" }} /> : null}
  </span>
);

// ── Thinking dots ─────────────────────────────────────────────────────────────
const ThinkingDots = () => (
  <span style={{ display:"inline-flex", gap:4, alignItems:"center" }}>
    {[0,1,2].map(i => (
      <span key={i} style={{ width:5,height:5,borderRadius:"50%",background:C.accent,display:"inline-block",animation:`nxPulse 1.2s ${i*.2}s infinite` }}/>
    ))}
  </span>
);

// ── Data ──────────────────────────────────────────────────────────────────────
const INITIAL_MESSAGES = [
  { id:1, role:"user", text:"What are the key breakthroughs in transformer architecture research in 2024?" },
  { id:2, role:"ai",
    html:`Several significant advances defined transformer research in 2024. The most notable trend was <strong>mixture-of-experts (MoE) scaling</strong>, with models like Mixtral and DeepSeek demonstrating that sparse activation could match dense models at a fraction of compute. <cite>1</cite><br/><br/>State-space models (SSMs) emerged as a serious architectural alternative, with <strong>Mamba-2</strong> showing competitive performance on long-context tasks while achieving linear time complexity. <cite>2</cite> Researchers also made major strides in extending context windows — models handling 1M+ tokens became practical. <cite>3</cite><br/><br/>On the efficiency front, <strong>FlashAttention-3</strong> reduced attention bottlenecks substantially, and speculative decoding techniques became standard practice in production inference pipelines. <cite>4</cite>`,
    followups:["Compare MoE vs dense models","How does Mamba-2 differ from attention?","Best papers to read on SSMs"],
  },
];

const SOURCES = [
  { id:1, num:"1", type:"arxiv", icoKey:"fileText", title:"Mixtral of Experts: Sparse Gating for Scalable LLMs", meta:"Mistral AI · Jan 2024", excerpt:"Each token is routed to 2 of 8 expert FFN layers, achieving 7B active params from a 47B total model." },
  { id:2, num:"2", type:"arxiv", icoKey:"fileText", title:"Mamba-2: State Space Duality and Sequence Modeling", meta:"Gu, Dao · May 2024", excerpt:"Establishes theoretical duality between SSMs and attention via structured matrices." },
  { id:3, num:"3", type:"web",   icoKey:"globe",    title:"Gemini 1.5: Long-context understanding at scale", meta:"Google DeepMind · Feb 2024", excerpt:"Achieves near-perfect recall on 1M token needle-in-haystack benchmarks." },
  { id:4, num:"4", type:"arxiv", icoKey:"fileText", title:"FlashAttention-3: Fast Attention for Hopper GPUs", meta:"Dao et al. · Jul 2024", excerpt:"Asynchronous warp-specialization reduces memory bandwidth bottlenecks by 75% on H100." },
];

const NAV_ITEMS = [
  { id:"chat",      k:"chat",      label:"Chat" },
  { id:"library",   k:"library",   label:"Library" },
  { id:"projects",  k:"projects",  label:"Projects" },
  { id:"spaces",    k:"spaces",    label:"Spaces", badge:"New" },
  { id:"history",   k:"history",   label:"History" },
  { id:"bookmarks", k:"bookmarks", label:"Bookmarks" },
  { id:"discover",  k:"discover",  label:"Discover" },
];

const RECENTS = [
  { k:"dna",      label:"Quantum computing review" },
  { k:"brain",    label:"LLM alignment papers" },
  { k:"virus",    label:"Gene therapy 2024" },
  { k:"universe", label:"Dark matter models" },
];

const ACTION_TOOLS = [
  { k:"headphones", label:"Audio Overview" },
  { k:"notebook",   label:"Study Guide" },
  { k:"faq",        label:"FAQ" },
  { k:"timeline",   label:"Timeline" },
  { k:"video",      label:"Video Script" },
];

// ── Global CSS ────────────────────────────────────────────────────────────────
const GCSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
html,body,#root{height:100%;background:#0a0a0a;color:#f0f0f0;font-family:-apple-system,BlinkMacSystemFont,'Inter','Segoe UI',sans-serif;font-size:14px;-webkit-font-smoothing:antialiased;}
::-webkit-scrollbar{width:3px;height:3px;}
::-webkit-scrollbar-track{background:transparent;}
::-webkit-scrollbar-thumb{background:#222;border-radius:2px;}
::-webkit-scrollbar-thumb:hover{background:#333;}
@keyframes nxPulse{0%,100%{opacity:.3;transform:scale(.8);}50%{opacity:1;transform:scale(1);}}
@keyframes nxFade{from{opacity:0;transform:translateY(5px);}to{opacity:1;transform:translateY(0);}}
.nx-fade{animation:nxFade .22s ease forwards;}
strong{font-weight:500;color:#f0f0f0;}
cite{display:inline-flex;align-items:center;justify-content:center;min-width:17px;height:17px;background:rgba(212,168,67,.12);border:1px solid rgba(212,168,67,.22);color:#d4a843;padding:0 5px;border-radius:4px;font-size:10px;font-weight:600;font-style:normal;cursor:pointer;margin:0 2px;transition:background .15s;vertical-align:middle;}
cite:hover{background:rgba(212,168,67,.26);}
textarea,button,input{font-family:inherit;}
button{cursor:pointer;}
.nx-nav{display:flex;align-items:center;gap:9px;padding:7px 10px;border-radius:8px;font-size:12px;color:#888;border:none;background:transparent;width:100%;text-align:left;cursor:pointer;transition:background .12s,color .12s;margin-bottom:1px;}
.nx-nav:hover{background:#1c1c1c;color:#f0f0f0;}
.nx-nav.active{background:#222;color:#f0f0f0;}
.nx-hico{display:flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:8px;border:1px solid rgba(255,255,255,.08);background:transparent;color:#666;transition:border-color .15s,color .15s,background .15s;cursor:pointer;}
.nx-hico:hover{border-color:rgba(255,255,255,.16);color:#f0f0f0;background:#1c1c1c;}
.nx-hico.on{border-color:rgba(212,168,67,.4);color:#d4a843;background:rgba(212,168,67,.08);}
.nx-src{background:#161616;border:1px solid rgba(255,255,255,.07);border-radius:10px;padding:10px;margin-bottom:7px;cursor:pointer;transition:border-color .15s,background .15s;}
.nx-src:hover{border-color:rgba(255,255,255,.16);background:#1c1c1c;}
.nx-fu{background:#1c1c1c;border:1px solid rgba(255,255,255,.07);color:#888;padding:5px 12px;border-radius:20px;font-size:11px;cursor:pointer;white-space:nowrap;transition:border-color .15s,color .15s,background .15s;}
.nx-fu:hover{border-color:rgba(212,168,67,.4);color:#d4a843;background:rgba(212,168,67,.06);}
.nx-meta{background:transparent;border:none;color:#5a5a5a;font-size:11px;display:flex;align-items:center;gap:5px;padding:3px 7px;border-radius:5px;transition:color .12s,background .12s;}
.nx-meta:hover{color:#f0f0f0;background:#1c1c1c;}
.nx-tool{display:flex;align-items:center;gap:5px;padding:4px 10px;border-radius:6px;background:transparent;border:1px solid rgba(255,255,255,.07);color:#666;font-size:11px;cursor:pointer;transition:border-color .15s,color .15s,background .15s;white-space:nowrap;}
.nx-tool:hover{border-color:rgba(255,255,255,.14);color:#ccc;background:#1c1c1c;}
.nx-itag{display:flex;align-items:center;gap:4px;background:#1c1c1c;border:1px solid rgba(255,255,255,.07);color:#888;padding:4px 9px;border-radius:6px;font-size:11px;cursor:pointer;transition:border-color .15s,color .15s,background .15s;}
.nx-itag:hover{border-color:rgba(255,255,255,.14);color:#f0f0f0;}
.nx-itag.on{border-color:rgba(212,168,67,.4);color:#d4a843;background:rgba(212,168,67,.06);}
.nx-ptab{padding:3px 9px;border-radius:5px;font-size:11px;color:#666;cursor:pointer;border:none;background:transparent;transition:background .12s,color .12s;}
.nx-ptab.active{background:#222;color:#f0f0f0;}
.nx-recent{padding:6px 10px;border-radius:6px;font-size:11px;color:#5a5a5a;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:1px;border:none;background:transparent;width:100%;text-align:left;transition:background .12s,color .12s;display:flex;align-items:center;gap:7px;}
.nx-recent:hover{background:#1c1c1c;color:#f0f0f0;}
.nx-drop{border:1px dashed rgba(255,255,255,.11);border-radius:10px;padding:14px 12px;text-align:center;cursor:pointer;margin-bottom:10px;transition:border-color .15s,background .15s;}
.nx-drop:hover{border-color:rgba(212,168,67,.38);background:rgba(212,168,67,.03);}
.nx-inp{background:#161616;border:1px solid rgba(255,255,255,.11);border-radius:13px;padding:10px 12px;display:flex;align-items:flex-end;gap:8px;transition:border-color .2s;}
.nx-inp:focus-within{border-color:rgba(212,168,67,.38);}
.nx-overlay{position:fixed;inset:0;background:rgba(0,0,0,.72);display:flex;align-items:center;justify-content:center;z-index:100;}
.nx-modal{background:#111;border:1px solid rgba(255,255,255,.11);border-radius:14px;width:520px;max-height:80vh;display:flex;flex-direction:column;overflow:hidden;}
.nx-stab{padding:7px 12px;border-radius:7px;font-size:12px;border:none;background:transparent;color:#666;cursor:pointer;transition:background .12s,color .12s;text-align:left;display:flex;align-items:center;gap:8px;width:100%;margin-bottom:2px;}
.nx-stab:hover{background:#1c1c1c;color:#f0f0f0;}
.nx-stab.active{background:#222;color:#f0f0f0;}
.nx-toggle{position:relative;width:36px;height:20px;border-radius:10px;background:#222;border:1px solid rgba(255,255,255,.1);cursor:pointer;transition:background .2s;flex-shrink:0;}
.nx-toggle.on{background:rgba(212,168,67,.85);}
.nx-toggle::after{content:'';position:absolute;top:2px;left:2px;width:14px;height:14px;border-radius:50%;background:#f0f0f0;transition:transform .2s;}
.nx-toggle.on::after{transform:translateX(16px);}
.nx-pmenu{position:absolute;top:calc(100% + 7px);right:0;background:#161616;border:1px solid rgba(255,255,255,.11);border-radius:10px;width:200px;padding:6px;z-index:50;}
.nx-pmitem{display:flex;align-items:center;gap:9px;padding:7px 10px;border-radius:7px;font-size:12px;color:#888;cursor:pointer;border:none;background:transparent;width:100%;transition:background .12s,color .12s;}
.nx-pmitem:hover{background:#222;color:#f0f0f0;}
.nx-pmitem.danger:hover{color:#e05555;background:rgba(224,85,85,.08);}
`;

// ── Helpers ───────────────────────────────────────────────────────────────────
const NexusLogo = ({ size = 28 }) => (
  <div style={{ width:size,height:size,borderRadius:Math.round(size*.27),background:C.accent,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
    <svg width={size*.56} height={size*.56} viewBox="0 0 16 16" fill="#0a0a0a">
      <path d="M8 1L2 4v4c0 3.3 2.5 6.4 6 7 3.5-.6 6-3.7 6-7V4L8 1zm0 2.2 4 2v3.3c0 2.2-1.6 4.3-4 4.9-2.4-.6-4-2.7-4-4.9V5.2l4-2z"/>
    </svg>
  </div>
);

const AiAvatar = ({ size = 26 }) => (
  <div style={{ width:size,height:size,borderRadius:Math.round(size*.28),background:C.accent,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:3 }}>
    <svg width={size*.52} height={size*.52} viewBox="0 0 16 16" fill="#0a0a0a">
      <path d="M8 1L2 4v4c0 3.3 2.5 6.4 6 7 3.5-.6 6-3.7 6-7V4L8 1zm0 2.2 4 2v3.3c0 2.2-1.6 4.3-4 4.9-2.4-.6-4-2.7-4-4.9V5.2l4-2z"/>
    </svg>
  </div>
);

const Toggle = ({ on, onToggle }) => (
  <div className={`nx-toggle${on?" on":""}`} onClick={onToggle} role="switch" aria-checked={on} />
);

// ── Settings Modal ────────────────────────────────────────────────────────────
const S_TABS = [
  { id:"general",  k:"adjustments", label:"General" },
  { id:"appear",   k:"palette",     label:"Appearance" },
  { id:"models",   k:"cpu",         label:"Models" },
  { id:"search",   k:"telescope",   label:"Search & Sources" },
  { id:"privacy",  k:"shield",      label:"Privacy" },
  { id:"notifs",   k:"bell",        label:"Notifications" },
  { id:"keys",     k:"keyboardIco", label:"Shortcuts" },
  { id:"account",  k:"user",        label:"Account" },
];

function SettingsModal({ onClose }) {
  const [tab, setTab] = useState("general");
  const [t, setT] = useState({ deepSearch:true, webSearch:true, citations:true, autoSave:false, notifs:false, motion:false, compact:false, dark:true });
  const tog = k => setT(p => ({...p,[k]:!p[k]}));
  const Row = ({ label, desc, k }: { label: string; desc?: string; k: string }) => (
    <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 0",borderBottom:`1px solid ${C.border}` }}>
      <div><div style={{ fontSize:13,color:C.text }}>{label}</div>{desc&&<div style={{ fontSize:11,color:C.muted2,marginTop:2 }}>{desc}</div>}</div>
      <Toggle on={t[k]} onToggle={() => tog(k)} />
    </div>
  );
  return (
    <div className="nx-overlay" onClick={e => e.target===e.currentTarget&&onClose()}>
      <div className="nx-modal">
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"15px 20px",borderBottom:`1px solid ${C.border}`,flexShrink:0 }}>
          <div style={{ display:"flex",alignItems:"center",gap:8 }}>
            <Ico k="settings" size={15} style={{ color:C.accent }}/>
            <span style={{ fontSize:14,fontWeight:500 }}>Settings</span>
          </div>
          <button className="nx-hico" onClick={onClose}><Ico k="x" size={14}/></button>
        </div>
        <div style={{ display:"flex",flex:1,overflow:"hidden",minHeight:0 }}>
          <div style={{ width:168,borderRight:`1px solid ${C.border}`,padding:"10px 8px",flexShrink:0,overflowY:"auto" }}>
            {S_TABS.map(st => (
              <button key={st.id} className={`nx-stab${tab===st.id?" active":""}`} onClick={()=>setTab(st.id)}>
                <Ico k={st.k} size={14}/>{st.label}
              </button>
            ))}
          </div>
          <div style={{ flex:1,overflowY:"auto",padding:"16px 20px" }}>
            {tab==="general"&&<><div style={{ fontSize:11,color:C.muted2,marginBottom:12,letterSpacing:"0.05em",textTransform:"uppercase" }}>General</div><Row label="Deep Research mode" desc="Multi-step web search pipeline" k="deepSearch"/><Row label="Web search" desc="Allow real-time lookups" k="webSearch"/><Row label="Auto-cite sources" desc="Inline citation tags on responses" k="citations"/><Row label="Auto-save sessions" desc="Persist chats to library" k="autoSave"/><Row label="Compact messages" desc="Reduce line spacing in chat" k="compact"/></>}
            {tab==="appear"&&<><div style={{ fontSize:11,color:C.muted2,marginBottom:12,letterSpacing:"0.05em",textTransform:"uppercase" }}>Appearance</div><Row label="Dark mode" k="dark"/><Row label="Reduced motion" desc="Disable animations" k="motion"/><div style={{ marginTop:16 }}><div style={{ fontSize:12,color:C.muted2,marginBottom:8 }}>Accent color</div><div style={{ display:"flex",gap:8 }}>{["#d4a843","#4a9eff","#3ecf8e","#e05555","#b06aff"].map(col=><div key={col} style={{ width:24,height:24,borderRadius:"50%",background:col,cursor:"pointer",border:`2px solid ${col==="#d4a843"?"#fff":"transparent"}` }}/>)}</div></div></>}
            {tab==="models"&&<><div style={{ fontSize:11,color:C.muted2,marginBottom:12,letterSpacing:"0.05em",textTransform:"uppercase" }}>Models</div>{[["Nexus Pro","Best quality, slower"],["Nexus Fast","Balanced speed & quality"],["Nexus Lite","Fastest, lightweight"]].map(([n,d],i)=><div key={i} style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 12px",borderRadius:8,border:`1px solid ${i===0?C.accentMid:C.border}`,background:i===0?C.accentDim:"transparent",marginBottom:7,cursor:"pointer" }}><div><div style={{ fontSize:13,color:C.text }}>{n}</div><div style={{ fontSize:11,color:C.muted2 }}>{d}</div></div>{i===0&&<span style={{ fontSize:10,color:C.accent,background:C.accentDim,padding:"2px 7px",borderRadius:10,fontWeight:600 }}>Active</span>}</div>)}</>}
            {(tab==="search"||tab==="privacy"||tab==="notifs"||tab==="keys"||tab==="account")&&<div style={{ color:C.muted2,fontSize:13,marginTop:12 }}>This section is coming in the next update.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Profile Menu ──────────────────────────────────────────────────────────────
function ProfileMenu({ onClose, onSettings }) {
  return (
    <div className="nx-pmenu">
      <div style={{ padding:"8px 10px 8px",borderBottom:`1px solid ${C.border}`,marginBottom:4 }}>
        <div style={{ fontSize:13,fontWeight:500 }}>Kjv Rajesh</div>
        <div style={{ fontSize:11,color:C.muted2 }}>rajeshwind123@gmail.com</div>
      </div>
      {[{k:"user",l:"Your profile"},{k:"crown",l:"Upgrade to Pro"},{k:"plug",l:"Integrations"},{k:"key",l:"API access"}].map(({k,l})=>(
        <button key={l} className="nx-pmitem" onClick={onClose}><Ico k={k} size={14}/>{l}</button>
      ))}
      <div style={{ borderTop:`1px solid ${C.border}`,marginTop:4,paddingTop:4 }}>
        <button className="nx-pmitem" onClick={()=>{onClose();onSettings();}}><Ico k="settings" size={14}/>Settings</button>
        <button className="nx-pmitem danger" onClick={onClose}><Ico k="logout" size={14}/>Sign out</button>
      </div>
    </div>
  );
}

// ── Header ────────────────────────────────────────────────────────────────────
function Header({ onToggleSources, onOpenSettings, sourcesOn }) {
  const [showProfile, setShowProfile] = useState(false);
  return (
    <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 18px",background:C.surface,borderBottom:`1px solid ${C.border}`,flexShrink:0,position:"relative",zIndex:10 }}>
      <div style={{ display:"flex",alignItems:"center",gap:10 }}>
        <NexusLogo/>
        <div>
          <div style={{ fontSize:14,fontWeight:600,letterSpacing:"0.02em" }}>Nexus</div>
          <div style={{ fontSize:9,color:C.muted,letterSpacing:"0.09em",textTransform:"uppercase",marginTop:1 }}>Research Assistant</div>
        </div>
      </div>
      <div style={{ display:"flex",alignItems:"center",gap:5 }}>
        <button className={`nx-hico${sourcesOn?" on":""}`} title="Sources panel" onClick={onToggleSources}><Ico k="sidebarRight" size={15}/></button>
        <button className="nx-hico" title="Keyboard shortcuts"><Ico k="keyboard" size={15}/></button>
        <button className="nx-hico" title="Settings" onClick={onOpenSettings}><Ico k="settings" size={15}/></button>
        <div style={{ position:"relative" }}>
          <div onClick={()=>setShowProfile(p=>!p)} style={{ width:32,height:32,borderRadius:"50%",background:`linear-gradient(135deg,${C.accent},#c49633)`,border:`2px solid rgba(255,255,255,.12)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:"#0a0a0a",fontWeight:700,cursor:"pointer",flexShrink:0,userSelect:"none" }}>KR</div>
          {showProfile&&<ProfileMenu onClose={()=>setShowProfile(false)} onSettings={onOpenSettings}/>}
        </div>
      </div>
    </div>
  );
}

// ── Left Sidebar ──────────────────────────────────────────────────────────────
function LeftSidebar({ activeNav, setActiveNav, onOpenSettings }) {
  return (
    <div style={{ width:198,background:C.surface,borderRight:`1px solid ${C.border}`,display:"flex",flexDirection:"column",padding:"12px 10px",flexShrink:0 }}>
      <button
        style={{ display:"flex",alignItems:"center",gap:8,padding:"8px 12px",borderRadius:8,background:C.surface3,border:`1px solid ${C.border2}`,color:C.text,fontSize:12,cursor:"pointer",marginBottom:16,transition:"background .15s" }}
        onMouseEnter={e=>e.currentTarget.style.background=C.surface4}
        onMouseLeave={e=>e.currentTarget.style.background=C.surface3}
      >
        <Ico k="plus" size={14}/> New Research
      </button>

      <div style={{ marginBottom:14 }}>
        <div style={{ fontSize:9,color:C.muted,letterSpacing:"0.1em",textTransform:"uppercase",padding:"0 6px",marginBottom:5 }}>Workspace</div>
        {NAV_ITEMS.map(({id,k,label,badge})=>(
          <button key={id} className={`nx-nav${activeNav===id?" active":""}`} onClick={()=>setActiveNav(id)}>
            <Ico k={k} size={15}/>
            <span style={{ flex:1 }}>{label}</span>
            {badge&&<span style={{ background:C.accent,color:"#0a0a0a",fontSize:9,padding:"1px 5px",borderRadius:10,fontWeight:700 }}>{badge}</span>}
          </button>
        ))}
      </div>

      <div style={{ marginBottom:14 }}>
        <div style={{ fontSize:9,color:C.muted,letterSpacing:"0.1em",textTransform:"uppercase",padding:"0 6px",marginBottom:5 }}>Recent</div>
        {RECENTS.map(({k,label},i)=>(
          <button key={i} className="nx-recent"><Ico k={k} size={13} style={{ color:C.muted2 }}/>{label}</button>
        ))}
      </div>

      {/* Bottom: profile + settings */}
      <div style={{ marginTop:"auto" }}>
        <div style={{ height:1,background:C.border,marginBottom:8 }}/>
        <button className="nx-nav" onClick={onOpenSettings}>
          <Ico k="settings" size={15}/> Settings
        </button>
        {/* Profile row */}
        <div className="nx-nav" style={{ gap:9 }}>
          <div style={{ width:24,height:24,borderRadius:"50%",background:`linear-gradient(135deg,${C.accent},#c49633)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:"#0a0a0a",fontWeight:700,flexShrink:0 }}>KR</div>
          <div style={{ flex:1,overflow:"hidden" }}>
            <div style={{ fontSize:11,color:C.text,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>Kjv Rajesh</div>
            <div style={{ fontSize:10,color:C.muted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>Pro</div>
          </div>
          <Ico k="chevronDown" size={12} style={{ color:C.muted }}/>
        </div>
      </div>
    </div>
  );
}

// ── Messages ──────────────────────────────────────────────────────────────────
const UserBubble = ({ text }) => (
  <div style={{ display:"flex",justifyContent:"flex-end" }} className="nx-fade">
    <div style={{ background:C.surface3,border:`1px solid ${C.border2}`,padding:"10px 14px",borderRadius:"12px 12px 3px 12px",maxWidth:"70%",fontSize:13,lineHeight:1.6,color:C.text }}>{text}</div>
  </div>
);

const AiBubble = ({ html, followups, onFollowup }) => (
  <div style={{ display:"flex",flexDirection:"column" }} className="nx-fade">
    <div style={{ display:"flex",gap:10,alignItems:"flex-start" }}>
      <AiAvatar/>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:13,lineHeight:1.75,color:C.text }} dangerouslySetInnerHTML={{ __html:html }}/>
        <div style={{ display:"flex",alignItems:"center",gap:2,marginTop:10,flexWrap:"wrap" }}>
          {[["copy","Copy"],["share","Share"],["refresh","Retry"],["thumbUp",""],["thumbDown",""]].map(([ico,lbl])=>(
            <button key={ico} className="nx-meta"><Ico k={ico} size={13}/>{lbl}</button>
          ))}
        </div>
      </div>
    </div>
    {followups&&(
      <div style={{ display:"flex",gap:6,flexWrap:"wrap",marginTop:11,paddingLeft:36 }}>
        {followups.map((f,i)=><button key={i} className="nx-fu" onClick={()=>onFollowup(f)}>{f}</button>)}
      </div>
    )}
  </div>
);

const ThinkingMsg = ({ query }) => (
  <div style={{ display:"flex",gap:10,alignItems:"center" }} className="nx-fade">
    <AiAvatar/>
    <ThinkingDots/>
    <span style={{ fontSize:12,color:C.muted2 }}>{query?`Searching for "${query.slice(0,45)}${query.length>45?"…":""}"`:"Thinking…"}</span>
  </div>
);

// ── Input Area ────────────────────────────────────────────────────────────────
function InputArea({ onSend }) {
  const [val, setVal] = useState("");
  const [deepOn, setDeepOn] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const taRef = useRef(null);
  const submit = () => {
    const t = val.trim(); if(!t) return;
    onSend(t); setVal("");
    if(taRef.current) taRef.current.style.height="22px";
  };
  const resize = e => { e.target.style.height="22px"; e.target.style.height=Math.min(e.target.scrollHeight,120)+"px"; };

  return (
    <div style={{ padding:"0 16px 14px",background:C.surface,borderTop:`1px solid ${C.border}`,flexShrink:0 }}>
      {/* Compact action tools — tight row above input */}
      <div style={{ display:"flex",gap:5,padding:"8px 0 7px",overflowX:"auto",flexShrink:0 }}>
        {ACTION_TOOLS.map(({k,label})=>(
          <button key={label} className="nx-tool"><Ico k={k} size={12}/>{label}</button>
        ))}
      </div>

      {/* Input box */}
      <div className="nx-inp">
        <button className="nx-meta" title="Attach file" style={{ padding:"3px 4px",marginBottom:1 }}><Ico k="paperclip" size={17}/></button>
        <button className="nx-meta" title="Add image or video" style={{ padding:"3px 4px",marginBottom:1 }}><Ico k="image" size={17}/></button>
        <textarea
          ref={taRef}
          style={{ flex:1,background:"transparent",border:"none",color:C.text,fontSize:13,outline:"none",resize:"none",lineHeight:1.55,minHeight:22,maxHeight:120 }}
          placeholder="Ask a research question…"
          value={val}
          onChange={e=>{ setVal(e.target.value); resize(e); }}
          onKeyDown={e=>{ if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();submit();}}}
          rows={1}
        />
        <button
          className="nx-meta"
          title="Voice input"
          onClick={()=>setMicOn(p=>!p)}
          style={{ padding:"3px 4px",marginBottom:1,color:micOn?C.accent:undefined }}
        ><Ico k="mic" size={17} style={{ color:micOn?C.accent:undefined }}/></button>
        <button
          onClick={submit}
          title="Send"
          style={{ width:30,height:30,borderRadius:8,background:val.trim()?C.accent:"#1c1c1c",border:"none",display:"flex",alignItems:"center",justifyContent:"center",padding:0,flexShrink:0,marginBottom:1,transition:"background .15s" }}
        ><Ico k="send" size={13} style={{ color:val.trim()?"#0a0a0a":C.muted }}/></button>
      </div>

      {/* Footer */}
      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:8 }}>
        <div style={{ display:"flex",gap:5,flexWrap:"wrap" }}>
          <button className={`nx-itag${deepOn?" on":""}`} onClick={()=>setDeepOn(p=>!p)}><Ico k="telescope" size={12}/>Deep Search</button>
          <button className="nx-itag"><Ico k="doc" size={12}/>Docs</button>
          <button className="nx-itag"><Ico k="atom" size={12}/>Academic</button>
          <button className="nx-itag"><Ico k="code" size={12}/>Code</button>
        </div>
        <button style={{ background:"transparent",border:"none",fontSize:11,color:C.muted2,display:"flex",alignItems:"center",gap:4,cursor:"pointer" }}>
          <Ico k="cpu" size={12}/>Nexus Pro<Ico k="chevronDown" size={11}/>
        </button>
      </div>
    </div>
  );
}

// ── Sources Panel ─────────────────────────────────────────────────────────────
function SourcesPanel({ activeTab, setActiveTab }) {
  return (
    <div style={{ width:278,background:C.surface,borderLeft:`1px solid ${C.border}`,display:"flex",flexDirection:"column",flexShrink:0,overflow:"hidden" }}>
      <div style={{ padding:"12px 14px 9px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0 }}>
        <div style={{ display:"flex",alignItems:"center",gap:6,fontSize:12,fontWeight:500 }}>
          <Ico k="books" size={14} style={{ color:C.accent }}/>Sources & Insights
        </div>
        <div style={{ display:"flex",gap:2 }}>
          {["Sources","Notes"].map(t=>(
            <button key={t} className={`nx-ptab${activeTab===t?" active":""}`} onClick={()=>setActiveTab(t)}>{t}</button>
          ))}
        </div>
      </div>
      <div style={{ flex:1,overflowY:"auto",padding:"11px" }}>
        <div className="nx-drop">
          <div style={{ display:"flex",justifyContent:"center",marginBottom:5 }}><Ico k="upload" size={22} style={{ color:C.muted2 }}/></div>
          <p style={{ fontSize:11,color:C.muted2,lineHeight:1.5 }}>Drop PDFs, papers or links<br/><span style={{ color:C.accent }}>or click to upload</span></p>
        </div>
        <div style={{ fontSize:9,color:C.muted,letterSpacing:"0.08em",textTransform:"uppercase",padding:"7px 0 5px",borderTop:`1px solid ${C.border}`,marginTop:2 }}>Referenced · {SOURCES.length} sources</div>
        {SOURCES.map(s=>(
          <div key={s.id} className="nx-src">
            <div style={{ display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:5 }}>
              <span style={{ fontSize:10,color:C.accent,fontWeight:600,background:C.accentDim,padding:"1px 6px",borderRadius:4 }}>{s.num}</span>
              <span style={{ fontSize:10,color:C.muted,display:"flex",alignItems:"center",gap:3 }}><Ico k={s.icoKey} size={10}/>{s.type}</span>
            </div>
            <div style={{ fontSize:11.5,color:C.text,fontWeight:500,marginBottom:3,lineHeight:1.4 }}>{s.title}</div>
            <div style={{ fontSize:10,color:C.muted }}>{s.meta}</div>
            <div style={{ fontSize:11,color:C.muted2,marginTop:6,lineHeight:1.5,borderTop:`1px solid ${C.border}`,paddingTop:6 }}>{s.excerpt}</div>
          </div>
        ))}
        <div style={{ fontSize:9,color:C.muted,letterSpacing:"0.08em",textTransform:"uppercase",padding:"7px 0 5px",borderTop:`1px solid ${C.border}`,marginTop:4 }}>Key Insights</div>
        {[
          { k:"bulb",label:"Key Takeaways",items:["MoE achieves 3–4× compute savings vs dense equivalents","SSMs solve quadratic scaling for long inputs","Context windows grew 10× from 2023 to 2024"] },
          { k:"trending",label:"Research Trend",items:["Hybrid attention+SSM architectures gaining traction","Speculative decoding in ~80% of prod systems"] },
        ].map(({ k, label, items })=>(
          <div key={label} style={{ background:C.surface2,border:`1px solid ${C.border}`,borderRadius:9,padding:"9px 10px",marginBottom:7 }}>
            <div style={{ fontSize:10,color:C.accent,fontWeight:600,letterSpacing:"0.05em",textTransform:"uppercase",marginBottom:7,display:"flex",alignItems:"center",gap:4 }}>
              <Ico k={k} size={12}/>{label}
            </div>
            {items.map((ins,i)=>(
              <div key={i} style={{ display:"flex",alignItems:"flex-start",gap:7,fontSize:11,color:C.muted2,marginBottom:i<items.length-1?5:0,lineHeight:1.4 }}>
                <span style={{ width:4,height:4,borderRadius:"50%",background:C.accent,flexShrink:0,marginTop:5 }}/>
                {ins}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function NexusApp() {
  const [messages, setMessages]         = useState(INITIAL_MESSAGES);
  const [thinking, setThinking]         = useState(null);
  const [activeNav, setActiveNav]       = useState("chat");
  const [panelTab, setPanelTab]         = useState("Sources");
  const [showSources, setShowSources]   = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!document.getElementById("nx-gcss")) {
      const el = document.createElement("style");
      el.id = "nx-gcss"; el.textContent = GCSS;
      document.head.appendChild(el);
    }
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages, thinking]);

  const handleSend = text => {
    setMessages(p=>[...p,{ id:Date.now(),role:"user",text }]);
    setThinking(text);
    setTimeout(()=>{
      setThinking(null);
      setMessages(p=>[...p,{
        id:Date.now()+1, role:"ai",
        html:`Great question about <strong>"${text.slice(0,55)}${text.length>55?"…":""}"</strong>.<br/><br/>Based on the latest research, this area has seen rapid progress. Multiple competing frameworks have emerged, with 2024 work pointing toward hybrid approaches combining classical and novel paradigms. <cite>1</cite><br/><br/>The methodological consensus remains active, with three main schools of thought in the literature. Empirical results show statistically significant improvements over prior baselines. <cite>2</cite>`,
        followups:["Summarize the key papers","Show the timeline","What are the open problems?"],
      }]);
    }, 2000);
  };

  return (
    <div style={{ display:"flex",flexDirection:"column",height:"100vh",minHeight:0,background:C.bg,color:C.text,overflow:"hidden" }}>
      <Header onToggleSources={()=>setShowSources(s=>!s)} onOpenSettings={()=>setShowSettings(true)} sourcesOn={showSources}/>
      <div style={{ display:"flex",flex:1,overflow:"hidden",minHeight:0 }}>
        <LeftSidebar activeNav={activeNav} setActiveNav={setActiveNav} onOpenSettings={()=>setShowSettings(true)}/>
        <div style={{ flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minWidth:0 }}>
          <div style={{ flex:1,overflowY:"auto",padding:"22px 26px",display:"flex",flexDirection:"column",gap:20 }}>
            {messages.length<=2&&(
              <div style={{ background:C.surface2,border:`1px solid ${C.border}`,borderRadius:12,padding:"13px 16px",display:"flex",alignItems:"flex-start",gap:12 }} className="nx-fade">
                <NexusLogo size={30}/>
                <div>
                  <div style={{ fontSize:13,fontWeight:500,marginBottom:3 }}>Welcome to Nexus</div>
                  <div style={{ fontSize:12,color:C.muted2,lineHeight:1.55 }}>Your AI-powered research assistant. Ask anything, upload papers, or start a deep dive.</div>
                </div>
              </div>
            )}
            {messages.map(m => m.role==="user"
              ? <UserBubble key={m.id} text={m.text}/>
              : <AiBubble key={m.id} html={m.html} followups={m.followups} onFollowup={handleSend}/>
            )}
            {thinking&&<ThinkingMsg query={thinking}/>}
            <div ref={bottomRef}/>
          </div>
          <InputArea onSend={handleSend}/>
        </div>
        {showSources&&<SourcesPanel activeTab={panelTab} setActiveTab={setPanelTab}/>}
      </div>
      {showSettings&&<SettingsModal onClose={()=>setShowSettings(false)}/>}
    </div>
  );
}