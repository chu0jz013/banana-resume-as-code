import { type CSSProperties, type ReactNode } from 'react'
import { PRINT_MEASURE_CLASS, isExternalHref, renderRichText } from './shared'
import type { ResumeTemplateProps } from './types'
import type { ContactItem, ResumeData } from '../resumeTypes'

export default function YellowModernTemplate({ data, fontFamily }: ResumeTemplateProps) {
  const flatSkills = flattenSkillItems(data)
  const websiteContact = findWebsiteContact(data.profile.contacts)

  return (
    <>
      <style>{yellowModernCss}</style>
      <main
        className="resume tpl-yellow"
        style={{ ['--resume-font' as string]: fontFamily } as CSSProperties}
      >
        <header className="ym-header">
          <div className="ym-card ym-title-card">
            <span className="ym-title-chip">{data.profile.title}</span>
          </div>
          <div className="ym-card ym-name-card">
            <h1 className="ym-name">{data.profile.name}</h1>
            {websiteContact && (
              <a
                className="ym-website-note"
                href={websiteContact.href}
                target="_blank"
                rel="noreferrer"
              >
                <span className="ym-website-note-text">{websiteContact.label}</span>
                <span className="ym-website-note-cursor" aria-hidden="true">
                  <CursorIcon />
                </span>
              </a>
            )}
          </div>
        </header>

        <div className="ym-body">
          <aside className="ym-sidebar">
            <div className="ym-card ym-contact-card">
              <ul className="ym-contact-list">
                {data.profile.contacts.map((contact, index) => (
                  <li className="ym-contact-row" key={`${contact.label}-${index}`}>
                    <span className="ym-contact-icon" aria-hidden="true">
                      <ContactIcon contact={contact} />
                    </span>
                    {contact.href ? (
                      <a
                        href={contact.href}
                        target={isExternalHref(contact.href) ? '_blank' : undefined}
                        rel={isExternalHref(contact.href) ? 'noreferrer' : undefined}
                      >
                        {contact.label}
                      </a>
                    ) : (
                      <span>{contact.label}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <div className="ym-card ym-summary-card">
              <p className="ym-para">{renderRichText(data.summary)}</p>
            </div>

            <Card>
              <SectionHeading>Education</SectionHeading>
              {data.education.map((entry) => (
                <div className="ym-edu" key={`${entry.school}-${entry.period}`}>
                  <div className="ym-edu-credential">{entry.credential}</div>
                  <div className="ym-edu-school">
                    {entry.schoolUrl ? (
                      <a href={entry.schoolUrl} target="_blank" rel="noreferrer">
                        {entry.school}
                      </a>
                    ) : (
                      entry.school
                    )}
                  </div>
                  <div className="ym-edu-meta">{entry.period}</div>
                </div>
              ))}
            </Card>

            <Card>
              <SectionHeading>Skills</SectionHeading>
              {flatSkills.length > 0 ? (
                <div className="ym-skills-grid">
                  {flatSkills.map((skill, index) => (
                    <div className="ym-skill-cell" key={`${skill}-${index}`}>
                      {skill}
                    </div>
                  ))}
                </div>
              ) : null}
            </Card>

            {data.certifications.length > 0 && (
              <Card>
                <SectionHeading>Certifications</SectionHeading>
                <ul className="ym-cert-list">
                  {data.certifications.map((certification) => (
                    <li key={certification.name}>
                      {certification.url ? (
                        <a href={certification.url} target="_blank" rel="noreferrer">
                          <b>{certification.name}</b>
                        </a>
                      ) : (
                        <b>{certification.name}</b>
                      )}
                      <div className="ym-cert-issuer">{certification.issuer}</div>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </aside>

          <section className="ym-main">
            <Card>
              <SectionHeading>Professional Experience</SectionHeading>
              {data.experience.map((role) => (
                <div className="ym-role" key={`${role.company}-${role.period}`}>
                  <h3 className="ym-role-title">{role.title}</h3>
                  <div className="ym-role-meta">
                    {role.companyUrl ? (
                      <a href={role.companyUrl} target="_blank" rel="noreferrer">
                        {role.company}
                      </a>
                    ) : (
                      <span>{role.company}</span>
                    )}
                    {role.location && (
                      <>
                        <span className="ym-role-sep">|</span>
                        <span>{role.location}</span>
                      </>
                    )}
                    <span className="ym-role-sep">|</span>
                    <span>{role.period}</span>
                  </div>
                  <ul className="ym-bullets">
                    {role.bullets.map((bullet, index) => (
                      <li key={index}>{renderRichText(bullet)}</li>
                    ))}
                  </ul>
                </div>
              ))}

              {data.projects.length > 0 && (
                <>
                  <SectionHeading inline>Projects</SectionHeading>
                  {data.projects.map((project) => (
                    <div className="ym-role" key={project.name}>
                      <h3 className="ym-role-title">{project.name}</h3>
                      {(project.url || project.urlLabel) && (
                        <div className="ym-role-meta">
                          {project.url ? (
                            <a href={project.url} target="_blank" rel="noreferrer">
                              {project.urlLabel ?? project.url}
                            </a>
                          ) : (
                            <span>{project.urlLabel}</span>
                          )}
                        </div>
                      )}
                      <ul className="ym-bullets">
                        {project.bullets.map((bullet, index) => (
                          <li key={index}>{renderRichText(bullet)}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </>
              )}
            </Card>
          </section>
        </div>
      </main>
    </>
  )
}

function Card({ children }: { children: ReactNode }) {
  return <div className="ym-card">{children}</div>
}

function SectionHeading({ children, inline }: { children: ReactNode; inline?: boolean }) {
  return (
    <h2 className={`ym-heading${inline ? ' ym-heading-inline' : ''}`}>
      <span className="ym-heading-mark">{children}</span>
    </h2>
  )
}

function flattenSkillItems(data: ResumeData): string[] {
  return data.skills.flatMap((group) =>
    group.items
      .split(/[/,]/)
      .map((token) => token.trim())
      .filter(Boolean),
  )
}

function findWebsiteContact(contacts: ContactItem[]): ContactItem | null {
  for (const contact of contacts) {
    if (!contact.href) continue
    if (contact.href.startsWith('http://') || contact.href.startsWith('https://')) {
      return contact
    }
  }
  return null
}

function ContactIcon({ contact }: { contact: ContactItem }) {
  const href = contact.href ?? ''
  if (href.startsWith('mailto:')) return <MailIcon />
  if (href.startsWith('tel:')) return <PhoneIcon />
  if (href.startsWith('http://') || href.startsWith('https://')) return <LinkIcon />
  return <PinIcon />
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.69 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.33 1.85.56 2.81.69A2 2 0 0 1 22 16.92z" />
    </svg>
  )
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <polyline points="3 7 12 13 21 7" />
    </svg>
  )
}

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}

function LinkIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1.5 1.5" />
      <path d="M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1.5-1.5" />
    </svg>
  )
}

function CursorIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
      <path d="M5 3l14 7-6 2-2 6-6-15z" />
    </svg>
  )
}

const PAGE_BG = '#F5B23E'
const HIGHLIGHT_BG = '#FFE9B0'
const CARD_BG = '#FFFFFF'
const TEXT_PRIMARY = '#111827'
const TEXT_SECONDARY = '#374151'
const SUBTLE_BORDER = '#E5E7EB'
const MONO_STACK = `'JetBrains Mono', 'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`

const yellowModernCss = `
  .tpl-yellow.resume {
    width: 820px;
    max-width: 820px;
    margin: 28px auto 48px;
    background: ${PAGE_BG};
    padding: 22px 22px 28px;
    box-sizing: border-box;
    box-shadow: 0 1px 2px rgba(0,0,0,.08), 0 12px 28px rgba(0,0,0,.10);
    color: ${TEXT_PRIMARY};
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .tpl-yellow a { color: ${TEXT_PRIMARY}; text-decoration: underline; text-underline-offset: 2px; }
  .tpl-yellow a:hover { color: #1d4ed8; }

  .tpl-yellow .ym-card {
    background: ${CARD_BG};
    border-radius: 14px;
    padding: 14px 18px;
    box-shadow: 0 1px 0 rgba(0,0,0,.04);
  }

  .tpl-yellow .ym-header {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 10px;
    position: relative;
  }
  .tpl-yellow .ym-title-card {
    padding: 8px 14px;
    width: max-content;
  }
  .tpl-yellow .ym-title-chip {
    display: inline-block;
    background: ${HIGHLIGHT_BG};
    border-radius: 6px;
    padding: 4px 10px;
    font-family: ${MONO_STACK};
    font-size: 13px;
    font-weight: 700;
    color: ${TEXT_PRIMARY};
    letter-spacing: -0.1px;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .tpl-yellow .ym-name-card {
    padding: 18px 22px;
    position: relative;
  }
  .tpl-yellow .ym-name {
    margin: 0;
    font-family: ${MONO_STACK};
    font-size: 36px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    line-height: 1.05;
    color: ${TEXT_PRIMARY};
  }
  .tpl-yellow .ym-website-note {
    position: absolute;
    top: -18px;
    right: 24px;
    background: ${HIGHLIGHT_BG};
    border-radius: 8px;
    padding: 6px 12px;
    font-family: ${MONO_STACK};
    font-size: 11px;
    font-weight: 700;
    color: ${TEXT_PRIMARY};
    text-decoration: none;
    transform: rotate(-4deg);
    box-shadow: 0 1px 2px rgba(0,0,0,.06), 0 4px 10px rgba(0,0,0,.06);
    display: inline-flex;
    align-items: center;
    gap: 4px;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .tpl-yellow .ym-website-note-cursor { display: inline-flex; align-items: center; }

  .tpl-yellow .ym-body {
    display: grid;
    grid-template-columns: 290px 1fr;
    gap: 12px;
    align-items: start;
  }
  .tpl-yellow .ym-sidebar {
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-width: 0;
  }
  .tpl-yellow .ym-main { min-width: 0; }

  .tpl-yellow .ym-contact-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .tpl-yellow .ym-contact-row {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 12.5px;
    color: ${TEXT_SECONDARY};
    word-break: break-word;
  }
  .tpl-yellow .ym-contact-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    flex-shrink: 0;
    background: ${HIGHLIGHT_BG};
    border-radius: 6px;
    color: ${TEXT_PRIMARY};
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .tpl-yellow .ym-contact-row a { color: ${TEXT_PRIMARY}; text-decoration: none; }
  .tpl-yellow .ym-contact-row a:hover { text-decoration: underline; }

  .tpl-yellow .ym-heading {
    margin: 0 0 8px;
    line-height: 1;
  }
  .tpl-yellow .ym-heading-inline { margin-top: 14px; }
  .tpl-yellow .ym-heading-mark {
    display: inline-block;
    background: ${HIGHLIGHT_BG};
    border-radius: 4px;
    padding: 3px 8px;
    font-family: ${MONO_STACK};
    font-size: 13.5px;
    font-weight: 700;
    color: ${TEXT_PRIMARY};
    letter-spacing: -0.1px;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .tpl-yellow .ym-summary-card .ym-para {
    margin: 0;
    font-size: 12px;
    line-height: 1.5;
    color: ${TEXT_SECONDARY};
  }

  .tpl-yellow .ym-edu { margin-top: 6px; }
  .tpl-yellow .ym-edu:first-child { margin-top: 0; }
  .tpl-yellow .ym-edu-credential {
    font-size: 12.5px;
    font-weight: 700;
    color: ${TEXT_PRIMARY};
    line-height: 1.3;
  }
  .tpl-yellow .ym-edu-school {
    font-size: 12px;
    color: ${TEXT_SECONDARY};
    margin-top: 2px;
  }
  .tpl-yellow .ym-edu-meta {
    font-size: 11.5px;
    color: ${TEXT_SECONDARY};
    margin-top: 2px;
    font-variant-numeric: tabular-nums;
  }

  .tpl-yellow .ym-skills-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    border-left: 1px solid ${SUBTLE_BORDER};
    border-top: 1px solid ${SUBTLE_BORDER};
  }
  .tpl-yellow .ym-skill-cell {
    padding: 6px 10px;
    font-size: 11.5px;
    color: ${TEXT_PRIMARY};
    border-right: 1px solid ${SUBTLE_BORDER};
    border-bottom: 1px solid ${SUBTLE_BORDER};
    text-align: center;
  }

  .tpl-yellow .ym-cert-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .tpl-yellow .ym-cert-list li { font-size: 12px; color: ${TEXT_PRIMARY}; line-height: 1.35; }
  .tpl-yellow .ym-cert-issuer { font-size: 11.5px; color: ${TEXT_SECONDARY}; margin-top: 2px; }

  .tpl-yellow .ym-role { margin-top: 12px; }
  .tpl-yellow .ym-role:first-of-type { margin-top: 4px; }
  .tpl-yellow .ym-role-title {
    margin: 0;
    font-size: 13.5px;
    font-weight: 700;
    color: ${TEXT_PRIMARY};
    line-height: 1.3;
  }
  .tpl-yellow .ym-role-meta {
    margin-top: 2px;
    font-size: 12px;
    color: ${TEXT_SECONDARY};
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 6px;
    font-variant-numeric: tabular-nums;
  }
  .tpl-yellow .ym-role-meta a { color: ${TEXT_SECONDARY}; text-decoration: none; }
  .tpl-yellow .ym-role-meta a:hover { text-decoration: underline; }
  .tpl-yellow .ym-role-sep { color: #9ca3af; }
  .tpl-yellow .ym-bullets {
    margin: 6px 0 0;
    padding-left: 18px;
    color: ${TEXT_SECONDARY};
  }
  .tpl-yellow .ym-bullets li {
    font-size: 12px;
    line-height: 1.45;
    margin: 3px 0;
  }
  .tpl-yellow .ym-bullets code {
    font-family: ${MONO_STACK};
    font-size: 0.88em;
    background: #f3f4f6;
    padding: 0 3px;
    border-radius: 3px;
  }

  .tpl-yellow.${PRINT_MEASURE_CLASS} {
    position: absolute !important;
    visibility: hidden !important;
    pointer-events: none !important;
    left: -10000px !important;
    top: 0 !important;
    width: 210mm !important;
    box-sizing: border-box !important;
    max-width: none !important;
    margin: 0 !important;
    padding: 6mm 6mm 8mm !important;
    box-shadow: none !important;
    border: none !important;
  }
  .tpl-yellow.${PRINT_MEASURE_CLASS} .ym-name { font-size: 22pt; }
  .tpl-yellow.${PRINT_MEASURE_CLASS} .ym-title-chip { font-size: 9pt; }
  .tpl-yellow.${PRINT_MEASURE_CLASS} .ym-heading-mark { font-size: 9.5pt; }
  .tpl-yellow.${PRINT_MEASURE_CLASS} .ym-contact-row { font-size: 8.8pt; }
  .tpl-yellow.${PRINT_MEASURE_CLASS} .ym-summary-card .ym-para { font-size: 8.6pt; line-height: 1.35; }
  .tpl-yellow.${PRINT_MEASURE_CLASS} .ym-edu-credential { font-size: 9pt; }
  .tpl-yellow.${PRINT_MEASURE_CLASS} .ym-edu-school { font-size: 8.6pt; }
  .tpl-yellow.${PRINT_MEASURE_CLASS} .ym-edu-meta { font-size: 8.2pt; }
  .tpl-yellow.${PRINT_MEASURE_CLASS} .ym-skill-cell { font-size: 8.2pt; padding: 4px 6px; }
  .tpl-yellow.${PRINT_MEASURE_CLASS} .ym-role-title { font-size: 9.6pt; }
  .tpl-yellow.${PRINT_MEASURE_CLASS} .ym-role-meta { font-size: 8.6pt; }
  .tpl-yellow.${PRINT_MEASURE_CLASS} .ym-bullets li { font-size: 8.6pt; line-height: 1.3; margin: 2px 0; }
  .tpl-yellow.${PRINT_MEASURE_CLASS} .ym-cert-list li { font-size: 8.6pt; }
  .tpl-yellow.${PRINT_MEASURE_CLASS} .ym-cert-issuer { font-size: 8.2pt; }

  @media (max-width: 900px) {
    .tpl-yellow.resume { width: 100%; max-width: 820px; }
    .tpl-yellow .ym-body { grid-template-columns: 1fr; }
  }

  @media print {
    .tpl-yellow.resume {
      width: 210mm;
      height: 297mm;
      min-height: 0;
      max-width: none;
      margin: 0;
      padding: 6mm 6mm 8mm;
      box-sizing: border-box;
      box-shadow: none;
      border: none;
      overflow: hidden;
      background: ${PAGE_BG};
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .tpl-yellow * {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .tpl-yellow .ym-header { gap: 4px; margin-bottom: 6px; }
    .tpl-yellow .ym-title-card { padding: 6px 10px; }
    .tpl-yellow .ym-title-chip { font-size: 9pt; padding: 2px 8px; }
    .tpl-yellow .ym-name-card { padding: 10px 14px; }
    .tpl-yellow .ym-name { font-size: 22pt; }
    .tpl-yellow .ym-website-note { top: -10px; right: 14px; font-size: 8pt; padding: 4px 8px; }
    .tpl-yellow .ym-body { gap: 6px; grid-template-columns: 240px 1fr; }
    .tpl-yellow .ym-sidebar { gap: 6px; }
    .tpl-yellow .ym-card { padding: 8px 10px; border-radius: 10px; }
    .tpl-yellow .ym-heading { margin-bottom: 4px; }
    .tpl-yellow .ym-heading-mark { font-size: 9.5pt; padding: 2px 6px; }
    .tpl-yellow .ym-contact-list { gap: 5px; }
    .tpl-yellow .ym-contact-row { font-size: 8.8pt; gap: 6px; }
    .tpl-yellow .ym-contact-icon { width: 18px; height: 18px; }
    .tpl-yellow .ym-summary-card .ym-para { font-size: 8.6pt; line-height: 1.35; }
    .tpl-yellow .ym-edu-credential { font-size: 9pt; }
    .tpl-yellow .ym-edu-school { font-size: 8.6pt; }
    .tpl-yellow .ym-edu-meta { font-size: 8.2pt; }
    .tpl-yellow .ym-skill-cell { font-size: 8.2pt; padding: 3px 6px; }
    .tpl-yellow .ym-role { margin-top: 6px; }
    .tpl-yellow .ym-role-title { font-size: 9.6pt; }
    .tpl-yellow .ym-role-meta { font-size: 8.6pt; }
    .tpl-yellow .ym-bullets { padding-left: 14px; margin-top: 3px; }
    .tpl-yellow .ym-bullets li { font-size: 8.6pt; line-height: 1.3; margin: 2px 0; }
    .tpl-yellow .ym-cert-list { gap: 4px; }
    .tpl-yellow .ym-cert-list li { font-size: 8.6pt; }
    .tpl-yellow .ym-cert-issuer { font-size: 8.2pt; }
    .tpl-yellow a { color: ${TEXT_PRIMARY}; }
    .tpl-yellow .ym-role, .tpl-yellow .ym-edu, .tpl-yellow .ym-card { page-break-inside: avoid; break-inside: avoid; }
  }
`

