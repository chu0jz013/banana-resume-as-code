import type { FC } from 'react'
import type { ResumeData } from '../resumeTypes'

export type ResumeTemplateProps = {
  data: ResumeData
  fontFamily: string
}

export type ResumeTemplate = {
  id: string
  label: string
  description: string
  Component: FC<ResumeTemplateProps>
}
