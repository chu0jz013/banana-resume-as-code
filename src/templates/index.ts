import ClassicTemplate from './Classic'
import YellowModernTemplate from './YellowModern'
import type { ResumeTemplate } from './types'

export const TEMPLATES: ResumeTemplate[] = [
  {
    id: 'classic',
    label: 'Classic',
    description: 'Centered single-column - clean ATS-friendly',
    Component: ClassicTemplate,
  },
  {
    id: 'yellow-modern',
    label: 'Yellow Modern',
    description: 'Two-column - amber background - mono headings',
    Component: YellowModernTemplate,
  },
]

export const DEFAULT_TEMPLATE_ID = 'classic'

export function findTemplate(id: string): ResumeTemplate {
  return TEMPLATES.find((template) => template.id === id) ?? TEMPLATES[0]
}

export type { ResumeTemplate, ResumeTemplateProps } from './types'
