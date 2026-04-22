export type TextMark = 'bold' | 'code'

export type RichTextSpan = {
  text: string
  marks?: TextMark[]
  href?: string
}

export type RichText = RichTextSpan[]

export type ContactItem = {
  label: string
  href?: string
}

export type Profile = {
  name: string
  alias?: string
  title: string
  contacts: ContactItem[]
}

export type Project = {
  name: string
  url?: string
  urlLabel?: string
  bullets: RichText[]
}

export type ExperienceRole = {
  title: string
  company: string
  companyUrl?: string
  period: string
  bullets: RichText[]
}

export type SkillGroup = {
  group: string
  items: string
}

export type EducationEntry = {
  school: string
  schoolUrl?: string
  credential: string
  period: string
  bullets: RichText[]
}

export type Certification = {
  name: string
  issuer: string
  url?: string
}

export type ResumeData = {
  profile: Profile
  summary: RichText
  projects: Project[]
  experience: ExperienceRole[]
  skills: SkillGroup[]
  education: EducationEntry[]
  certifications: Certification[]
}
