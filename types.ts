
export interface ThemeConfig {
  bg: string;
  text: string;
  accent: string;
  card: string;
  nav: string;
  button: string;
  border: string;
  label: string;
  primaryColor: string;
}

export type ThemeMode = 'light' | 'yellow' | 'gradient' | 'navy' | 'violet';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface Project {
  id: string;
  title: string;
  description: string;
  longDescription?: string;
  techStack: string[];
  githubUrl?: string;
  liveUrl?: string;
  image: string;
  outcome?: string;
  order?: number;
}

export interface Experience {
  id: string;
  role: string;
  organization: string;
  duration: string;
  description: string[];
  certificateImageUrl?: string;
  verificationId?: string;
  verificationUrl?: string;
  order?: number;
}

export interface Certificate {
  id: string;
  title: string;
  issuer: string;
  date: string;
  imageUrl: string;
  description?: string;
  verificationId?: string;
  verificationUrl?: string;
  order?: number;
}

export interface Education {
  id: string;
  degree: string;
  institution: string;
  year: string;
  highlight: string;
}

export interface Resume {
  id: string;
  title: string;
  description: string;
  fileUrl: string;
  pdfUrl?: string; // Cache for temporary blob URL
  previewImageUrl: string;
  order?: number;
}

export interface ProfileData {
  name: string;
  greeting: string;
  tagline: string;
  imageUrl: string;
  isOpenToWork: boolean;
  position: string;
  organization: string;
  department: string;
}

export interface AboutData {
  text1: string;
  text2: string;
  imageUrl: string;
}

export interface ContactData {
  title: string;
  description: string;
  email: string;
  linkedin: string;
  github: string;
  leetcode: string;
  codeforces?: string;
  instagram: string;
  quoteText: string;
  quoteAuthor: string;
  additionalLinks?: { name: string; url: string; icon?: string }[];
}

export interface SkillCategory {
  id: string;
  title: string;
  skills: string[];
}

export interface Tool {
  id: string;
  name: string;
  icon: string;
}

export interface CodingProfile {
  id: string;
  name: string;
  icon: string;
  solved: string;
  streak: string;
  link: string;
}

export interface SectionHeadings {
  about: string;
  aboutSub: string;
  skills: string;
  skillsSub: string;
  tools: string;
  toolsSub: string;
  experience: string;
  experienceSub: string;
  certificates: string;
  certificatesSub: string;
  projects: string;
  projectsSub: string;
  codingProfiles: string;
  codingProfilesSub: string;
  education: string;
  educationSub: string;
  contact: string;
  contactSub: string;
  resumes: string;
  resumesSub: string;
}

export interface VisitorStat {
  timestamp: number;
  isNew: boolean;
  device: string;
  browser: string;
  country: string;
}

export interface AnalyticsData {
  totalViews: number;
  uniqueVisitors: number;
  history: VisitorStat[];
}
