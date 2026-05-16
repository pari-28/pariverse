
import React from 'react';
import { ThemeMode, Project, Experience, Certificate, Education, Resume, CodingProfile, SectionHeadings, ThemeConfig } from './types';

export const THEME_CONFIGS: Record<ThemeMode, ThemeConfig> = {
  light: {
    bg: 'bg-gradient-to-br from-[#FFFBF0] via-[#FFE4E6] to-[#E0F2FE]',
    text: 'text-slate-600',
    accent: 'text-black',
    card: 'bg-black/[0.12] backdrop-blur-2xl shadow-2xl border-black/10',
    nav: 'bg-white/90',
    button: 'bg-black hover:bg-slate-900 text-white shadow-lg',
    border: 'border-slate-300',
    label: 'Pastel Bloom',
    primaryColor: '#000000'
  },
  yellow: {
    bg: 'bg-black',
    text: 'text-white',
    accent: 'text-yellow-400',
    card: 'bg-white/10 backdrop-blur-2xl border border-yellow-400/30 shadow-2xl',
    nav: 'bg-black/90',
    button: 'bg-yellow-400 hover:bg-yellow-500 text-black',
    border: 'border-yellow-400/50',
    label: 'Solar Forge',
    primaryColor: '#FACC15'
  },
  gradient: {
    bg: 'bg-[#050505]',
    text: 'text-white',
    accent: 'text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500',
    card: 'bg-white/10 backdrop-blur-2xl border border-white/20 shadow-2xl',
    nav: 'bg-black/95',
    button: 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:opacity-90 text-white',
    border: 'border-white/20',
    label: 'Quantum Mind',
    primaryColor: '#A855F7'
  },
  navy: {
    bg: 'bg-[#0A192F]',
    text: 'text-slate-200',
    accent: 'text-[#64FFDA]',
    card: 'bg-[#112240]/95 backdrop-blur-3xl border border-[#233554] shadow-2xl',
    nav: 'bg-[#0A192F]/90',
    button: 'bg-transparent border border-[#64FFDA] text-[#64FFDA] hover:bg-[#64FFDA]/10',
    border: 'border-[#233554]',
    label: 'Stellar Atlas',
    primaryColor: '#64FFDA'
  },
  violet: {
    bg: 'bg-black',
    text: 'text-slate-100',
    accent: 'text-violet-400',
    card: 'bg-white/10 backdrop-blur-2xl border border-white/20 shadow-2xl',
    nav: 'bg-black/90',
    button: 'bg-violet-600 hover:bg-violet-700 text-white',
    border: 'border-white/20',
    label: 'Neural Flux',
    primaryColor: '#8B5CF6'
  }
};

export const INITIAL_PROJECTS: Project[] = [];
export const INITIAL_EXPERIENCE: Experience[] = [];
export const INITIAL_CERTIFICATES: Certificate[] = [];
export const INITIAL_EDUCATION: Education[] = [];
export const INITIAL_RESUMES: Resume[] = [];
export const INITIAL_CODING_PROFILES: CodingProfile[] = [];
export const INITIAL_SECTION_HEADINGS: SectionHeadings = {
  about: '',
  aboutSub: '',
  skills: '',
  skillsSub: '',
  tools: '',
  toolsSub: '',
  experience: '',
  experienceSub: '',
  certificates: '',
  certificatesSub: '',
  projects: '',
  projectsSub: '',
  codingProfiles: '',
  codingProfilesSub: '',
  education: '',
  educationSub: '',
  contact: '',
  contactSub: '',
  resumes: '',
  resumesSub: ''
};
