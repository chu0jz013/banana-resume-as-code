import { parse } from 'yaml'
import { z, type ZodIssue } from 'zod'
import type { ResumeData } from './resumeTypes'

const markSchema = z.enum(['bold', 'code'])

const richTextSpanSchema = z
  .object({
    text: z.string().min(1),
    marks: z.array(markSchema).min(1).optional(),
    href: z.string().min(1).optional(),
  })
  .strict()

const richTextSchema = z.array(richTextSpanSchema).min(1)

const resumeSchema = z
  .object({
    profile: z
      .object({
        name: z.string().min(1),
        alias: z.string().min(1).optional(),
        title: z.string().min(1),
        contacts: z
          .array(
            z
              .object({
                label: z.string().min(1),
                href: z.string().min(1).optional(),
              })
              .strict(),
          )
          .min(1),
      })
      .strict(),
    summary: richTextSchema,
    projects: z
      .array(
        z
          .object({
            name: z.string().min(1),
            url: z.string().min(1).optional(),
            urlLabel: z.string().min(1).optional(),
            bullets: z.array(richTextSchema).min(1),
          })
          .strict(),
      )
      .min(1),
    experience: z
      .array(
        z
          .object({
            title: z.string().min(1),
            company: z.string().min(1),
            companyUrl: z.string().min(1).optional(),
            period: z.string().min(1),
            bullets: z.array(richTextSchema).min(1),
          })
          .strict(),
      )
      .min(1),
    skills: z
      .array(
        z
          .object({
            group: z.string().min(1),
            items: z.string().min(1),
          })
          .strict(),
      )
      .min(1),
    education: z
      .array(
        z
          .object({
            school: z.string().min(1),
            credential: z.string().min(1),
            period: z.string().min(1),
            bullets: z.array(richTextSchema).min(1),
          })
          .strict(),
      )
      .min(1),
    certifications: z.array(
      z
        .object({
          name: z.string().min(1),
          issuer: z.string().min(1),
          url: z.string().min(1).optional(),
        })
        .strict(),
    ),
  })
  .strict()

export class ResumeYamlError extends Error {
  readonly issues: string[]

  constructor(message: string, issues: string[]) {
    super(message)
    this.name = 'ResumeYamlError'
    this.issues = issues
  }
}

export function parseResumeYaml(yamlText: string): ResumeData {
  let parsedYaml: unknown

  try {
    parsedYaml = parse(yamlText)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new ResumeYamlError('Invalid YAML syntax', [message])
  }

  const result = resumeSchema.safeParse(parsedYaml)

  if (!result.success) {
    throw new ResumeYamlError('Invalid resume YAML', formatResumeIssues(result.error.issues))
  }

  return result.data as ResumeData
}

export function formatResumeIssues(issues: ZodIssue[]) {
  return issues.map((issue) => `${formatIssuePath(issue.path)}: ${issue.message}`)
}

function formatIssuePath(path: PropertyKey[]) {
  if (path.length === 0) return '(root)'

  return path
    .map((part) => (typeof part === 'number' ? `[${part}]` : String(part)))
    .join('.')
    .replaceAll('.[', '[')
}
