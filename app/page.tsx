'use client'

import { useState, useRef, useEffect } from "react";
import Header from '@/components/layout/header';
import LeftSidebar from '@/components/layout/sidebar';
import SourcesPanel from '@/components/layout/sources-panel';
import SettingsModal from '@/components/settings/settings-modal';
import InputArea from '@/components/chat/input-area';
import ProfileMenu from '@/components/layout/profile-menu';

const C = {
  bg:"#0a0a0a", surface:"#111111", surface2:"#161616", surface3:"#1c1c1c", surface4:"#222222",
  border:"rgba(255,255,255,0.07)", border2:"rgba(255,255,255,0.11)", border3:"rgba(255,255,255,0.17)",
  text:"#f0f0f0", muted:"#5a5a5a", muted2:"#888888",
  accent:"#d4a843", accentDim:"rgba(212,168,67,0.12)", accentMid:"rgba(212,168,67,0.22)",
};

const ICONS = {
  chat: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  library: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
  projects: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  spaces: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><ellipse cx="12" cy="12" rx="10" ry="4"/><line x1="2" y1="12" x2="22" y2="12"/></svg>,
  history: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="12 8 12 12 14 14"/><path d="M3.05 11a9 9 0 1 1 .5 4m-.5 5v-5h5"/></svg>,
  bookmarks: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>,
  discover: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>,
  sidebarRight: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="15" y1="3" x2="15" y2="21"/></svg>,
  keyboard: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><line x1="6" y1="10" x2="6" y2="10"/><line x1="10" y1="10" x2="10" y2="10"/><line x1="14" y1="10" x2="14" y2="10"/><line x1="18" y1="10" x2="18" y2="10"/><line x1="6" y1="14" x2="18" y2="14"/></svg>,
  settings: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  user: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
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
  upload: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>,
  books: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><line x1="12" y1="6" x2="16" y2="6"/><line x1="12" y1="10" x2="16" y2="10"/></svg>,
  fileText: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  globe: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
  bulb: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><line x1="9" y1="18" x2="15" y2="18"/><line x1="10" y1="22" x2="14" y2="22"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/></svg>,
  trending: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  headphones: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z"/><path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>,
  notebook: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>,
  faq: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  timeline: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="2" x2="12" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  video: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>,
  telescope: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="2"/><path d="M2 12l4-4 4 4"/><path d="M22 8l-4 4-4-4"/><line x1="12" y1="14" x2="12" y2="22"/></svg>,
  doc: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  atom: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><path d="M20.2 20.2c2.04-2.03.02-7.36-4.5-11.9-4.54-4.52-9.87-6.54-11.9-4.5-2.04 2.03-.02 7.36 4.5 11.9 4.54 4.52 9.87 6.54 11.9 4.5z"/><path d="M15.7 15.7c4.52-4.54 6.54-9.87 4.5-11.9-2.03-2.04-7.36-.02-11.9 4.5-4.52 4.54-6.54 9.87-4.5 11.9 2.03 2.04 7.36.02 11.9-4.5z"/></svg>,
  code: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>,
  cpu: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></svg>,
  adjustments: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>,
  palette: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>,
  shield: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>,
  bell: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  keyboardIco: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><line x1="6" y1="10" x2="6.01" y2="10"/><line x1="10" y1="10" x2="10.01" y2="10"/><line x1="14" y1="10" x2="14.01" y2="10"/><line x1="18" y1="10" x2="18.01" y2="10"/><line x1="6" y1="14" x2="18" y2="14"/></svg>,
  crown: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z"/><line x1="5" y1="20" x2="19" y2="20"/></svg>,
  plug: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18"/><path d="M7 17l-5 5"/><path d="M17 7l5-5"/><path d="M8 21l-5-5 3-3 5 5-3 3z"/><path d="M16 3l5 5-3 3-5-5 3-3z"/></svg>,
  key: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>,
  logout: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
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

const ThinkingDots = () => (
  <span style={{ display:"inline-flex", gap:4, alignItems:"center" }}>
    {[0,1,2].map(i => (
      <span key={i} style={{ width:5,height:5,borderRadius:"50%",background:C.accent,display:"inline-block",animation:`nxPulse 1.2s ${i*.2}s infinite` }}/>
    ))}
  </span>
);

type MessageFile = {
  name: string;
  type: string;
  url?: string;
};

type Message = {
  id: number;
  role: "user" | "ai";
  text?: string;
  html?: string;
  followups?: string[];
  file?: MessageFile;
};

function toMessageFile(file: File): MessageFile {
  return {
    name: file.name,
    type: file.type,
    url: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
  };
}

const INITIAL_MESSAGES: Message[] = [
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

const UserBubble = ({ text, file }: Pick<Message, "text" | "file">) => (
  <div style={{ display:"flex",justifyContent:"flex-end" }} className="nx-fade">
    <div style={{ background:C.surface3,border:`1px solid ${C.border2}`,padding:"10px 14px",borderRadius:"12px 12px 3px 12px",maxWidth:"70%",fontSize:13,lineHeight:1.6,color:C.text }}>
      {file && (
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          background: C.surface2, border: `1px solid ${C.border}`,
          borderRadius: 8, padding: "8px 10px", marginBottom: text ? 8 : 0,
        }}>
          {file.url ? (
            <img src={file.url} alt={file.name} style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 6, flexShrink: 0 }} />
          ) : (
            <span style={{ fontSize: 18, flexShrink: 0 }}>{file.type.startsWith("image/") ? "🖼️" : "📄"}</span>
          )}
          <span style={{ fontSize: 12, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.name}</span>
        </div>
      )}
      {text}
    </div>
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

export default function NexusApp() {
  const [messages, setMessages]         = useState<Message[]>(INITIAL_MESSAGES);
  const [thinking, setThinking]         = useState<string | null>(null);
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

  const handleNewResearch = () => {
    setMessages([]);
    setThinking(null);
    setActiveNav("chat");
  };

  const handleSend = async (text: string, file?: File | null) => {
    const trimmed = text.trim();
    if (!trimmed && !file) return;

    const messageFile = file ? toMessageFile(file) : undefined;

    const userMessage: Message = {
      id: Date.now(),
      role: "user",
      text: trimmed || undefined,
      file: messageFile,
    };

    setMessages((prev) => [...prev, userMessage]);
    setThinking(trimmed || messageFile?.name || "Analyzing attachment");

    try {
      let filePayload: { name: string; type: string; base64: string } | null = null;
      if (file) {
        filePayload = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            const base64 = result.split(",")[1];
            resolve({
              name: file.name,
              type: file.type,
              base64,
            });
          };
          reader.onerror = (err) => reject(err);
          reader.readAsDataURL(file);
        });
      }

      const recentMessages = messages.slice(-10);

      const history = recentMessages
        .filter((msg) => msg.role === "user" || msg.role === "ai")
        .map((msg) => {
          let content = "";
          if (msg.text) content = msg.text;
          else if (msg.html) content = msg.html.replace(/<[^>]*>/g, "");
          if (msg.file) {
            content = content
              ? `${content}\n[Attached: ${msg.file.name}]`
              : `[Attached: ${msg.file.name}]`;
          }
          return {
            role: msg.role === "user" ? "user" : "assistant",
            content,
          };
        });

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed || (messageFile ? `[Attached file: ${messageFile.name}]` : ""),
          history,
          file: filePayload,
        }),
      });

      const data = await res.json();
      setThinking(null);

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to get response");
      }

      const aiMessage: Message = {
        id: Date.now() + 1,
        role: "ai",
        html: data.response
          .replace(/\n\n/g, "<br/><br/>")
          .replace(/\n/g, "<br/>")
          .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>"),
        followups: [
          "Tell me more about this",
          "What are the key papers?",
          "Explain with examples",
        ],
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Chat Error:", error);
      setThinking(null);

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "ai",
          html: "Sorry, something went wrong. Please try again.",
          followups: [],
        },
      ]);
    }
  };


  return (
    <div style={{ display:"flex",flexDirection:"column",height:"100vh",minHeight:0,background:C.bg,color:C.text,overflow:"hidden" }}>
      <Header onToggleSources={()=>setShowSources(s=>!s)} onOpenSettings={()=>setShowSettings(true)} sourcesOn={showSources}/>
      <div style={{ display:"flex",flex:1,overflow:"hidden",minHeight:0 }}>
        <LeftSidebar activeNav={activeNav} setActiveNav={setActiveNav} onOpenSettings={()=>setShowSettings(true)} onNewResearch={handleNewResearch}/>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
  
  {/* ==================== CHAT VIEW ==================== */}
  {activeNav === "chat" && (
    <>
      <div style={{ 
        flex: 1, 
        overflowY: "auto", 
        padding: "22px 26px", 
        display: "flex", 
        flexDirection: "column", 
        gap: 20 
      }}>
        
        {/* Welcome Message */}
        {messages.length <= 2 && (
          <div style={{ 
            background: C.surface2, 
            border: `1px solid ${C.border}`, 
            borderRadius: 12, 
            padding: "13px 16px", 
            display: "flex", 
            alignItems: "flex-start", 
            gap: 12 
          }} className="nx-fade">
            <NexusLogo size={30} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 3 }}>
                Welcome to Nexus
              </div>
              <div style={{ fontSize: 12, color: C.muted2, lineHeight: 1.55 }}>
                Your AI-powered research assistant. Ask anything, upload papers, or start a deep dive.
              </div>
            </div>
          </div>
        )}

        {/* Messages List */}
        {messages.map((m) =>
          m.role === "user" ? (
            <UserBubble key={m.id} text={m.text} file={m.file} />
          ) : (
            <AiBubble
              key={m.id}
              html={m.html}
              followups={m.followups}
              onFollowup={handleSend}
            />
          )
        )}

        {/* Thinking Indicator */}
        {thinking && <ThinkingMsg query={thinking} />}

        <div ref={bottomRef} />
      </div>

      {/* Input Box */}
      <InputArea onSend={handleSend} />
    </>
  )}

  {/* ==================== OTHER SECTIONS ==================== */}
  {activeNav === "spaces" && (
    <div style={{ padding: "40px", color: "#888", fontSize: 18 }}>
      Spaces Section (Coming soon...)
    </div>
  )}

  {activeNav === "library" && (
    <div style={{ padding: "40px", color: "#888", fontSize: 18 }}>
      Library Section (Coming soon...)
    </div>
  )}

  {activeNav === "projects" && (
    <div style={{ padding: "40px", color: "#888", fontSize: 18 }}>
      Projects Section (Coming soon...)
    </div>
  )}

  {activeNav === "history" && (
    <div style={{ padding: "40px", color: "#888", fontSize: 18 }}>
      History Section (Coming soon...)
    </div>
  )}

  {activeNav === "bookmarks" && (
    <div style={{ padding: "40px", color: "#888", fontSize: 18 }}>
      Bookmarks Section (Coming soon...)
    </div>
  )}

  {activeNav === "discover" && (
    <div style={{ padding: "40px", color: "#888", fontSize: 18 }}>
      Discover Section (Coming soon...)
    </div>
  )}

</div>
        {showSources&&<SourcesPanel activeTab={panelTab} setActiveTab={setPanelTab}/>}
      </div>
      {showSettings&&<SettingsModal onClose={()=>setShowSettings(false)}/>}
    </div>
  );

}