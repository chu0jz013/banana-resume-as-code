import { Fragment, type CSSProperties, type ReactNode } from 'react'
import { AVATAR_SRC, PRINT_MEASURE_CLASS, isExternalHref, renderRichText } from './shared'
import type { ResumeTemplateProps } from './types'

export default function ClassicTemplate({ data, fontFamily }: ResumeTemplateProps) {
  return (
    <>
      <style>{classicCss}</style>
      <main
        className="resume tpl-classic"
        style={{ ['--resume-font' as string]: fontFamily } as CSSProperties}
      >
        <header className="hdr">
          <img className="avatar" src={AVATAR_SRC} alt={data.profile.name} />
          <h1 className="name">{data.profile.name}</h1>
          <p className="contact">
            {data.profile.contacts.map((contact, index) => (
              <Fragment key={`${contact.label}-${index}`}>
                {index > 0 && <span className="bar">|</span>}
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
              </Fragment>
            ))}
          </p>
        </header>

        <Section title="Summary">
          <p className="para">{renderRichText(data.summary)}</p>
        </Section>

        <Section title="Experience">
          {data.experience.map((role) => (
            <div className="entry" key={`${role.company}-${role.period}`}>
              <div className="entry-head">
                <span className="entry-left">
                  <b>{role.title}</b>,{' '}
                  {role.companyUrl ? (
                    <a href={role.companyUrl} target="_blank" rel="noreferrer">
                      {role.company}
                    </a>
                  ) : (
                    role.company
                  )}
                  {role.location ? `, ${role.location}` : null}
                </span>
                <span className="entry-right">{role.period}</span>
              </div>
              <ul className="bullets">
                {role.bullets.map((bullet, index) => (
                  <li key={index}>{renderRichText(bullet)}</li>
                ))}
              </ul>
            </div>
          ))}
        </Section>

        <Section title="Projects">
          {data.projects.map((project) => (
            <div className="entry" key={project.name}>
              <div className="entry-head">
                <span className="entry-left">{project.name}</span>
                {(project.url || project.urlLabel) && (
                  <span className="entry-right">
                    {project.url ? (
                      <a href={project.url} target="_blank" rel="noreferrer">
                        {project.urlLabel ?? project.url}
                      </a>
                    ) : (
                      project.urlLabel
                    )}
                  </span>
                )}
              </div>
              <ul className="bullets">
                {project.bullets.map((bullet, index) => (
                  <li key={index}>{renderRichText(bullet)}</li>
                ))}
              </ul>
            </div>
          ))}
        </Section>

        <Section title="Skills">
          <div className="skills">
            {data.skills.map((skill) => (
              <div className="skill-row" key={skill.group}>
                <span className="skill-group">{skill.group}</span>
                <span className="skill-items">{skill.items}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Education">
          {data.education.map((entry) => (
            <div className="entry" key={`${entry.school}-${entry.period}`}>
              <div className="entry-head">
                <span className="entry-left">
                  {entry.schoolUrl ? (
                    <a href={entry.schoolUrl} target="_blank" rel="noreferrer">
                      <b>{entry.school}</b>
                    </a>
                  ) : (
                    <b>{entry.school}</b>
                  )}
                  , {entry.credential}
                </span>
                <span className="entry-right">{entry.period}</span>
              </div>
              <ul className="bullets">
                {entry.bullets.map((bullet, index) => (
                  <li key={index}>{renderRichText(bullet)}</li>
                ))}
              </ul>
            </div>
          ))}
        </Section>

        <Section title="Certifications">
          <ul className="bullets plain">
            {data.certifications.map((certification) => (
              <li key={certification.name}>
                {certification.url ? (
                  <a href={certification.url} target="_blank" rel="noreferrer">
                    <b>{certification.name}</b>
                  </a>
                ) : (
                  <b>{certification.name}</b>
                )}
                , {certification.issuer}
              </li>
            ))}
          </ul>
        </Section>
      </main>
    </>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="section">
      <h2 className="section-title">{title}</h2>
      <div className="section-body">{children}</div>
    </section>
  )
}

const classicCss = `
  .tpl-classic.resume {
    max-width: 820px;
    margin: 28px auto 48px;
    background: #fff;
    padding: 56px 64px;
    box-shadow: 0 1px 2px rgba(0,0,0,.05), 0 8px 24px rgba(0,0,0,.08);
    border: 1px solid #d1d5db;
    color: #111827;
  }
  .tpl-classic a { color: #111827; text-decoration: underline; text-underline-offset: 2px; }
  .tpl-classic a:hover { color: #1d4ed8; }

  .tpl-classic.${PRINT_MEASURE_CLASS} {
    position: absolute !important;
    visibility: hidden !important;
    pointer-events: none !important;
    left: -10000px !important;
    top: 0 !important;
    width: 210mm !important;
    box-sizing: border-box !important;
    max-width: none !important;
    margin: 0 !important;
    padding: 10mm 12mm !important;
    box-shadow: none !important;
    border: none !important;
  }

  .tpl-classic .hdr {
    position: relative;
    text-align: center;
    padding-right: 96px;
    padding-left: 96px;
    margin-bottom: 6px;
  }
  .tpl-classic .avatar {
    position: absolute; top: -4px; right: 0;
    width: 86px; height: 86px;
    border-radius: 50%;
    object-fit: cover;
    border: 1px solid #d1d5db;
  }
  .tpl-classic .name {
    margin: 0;
    font-size: 34px; font-weight: 700;
    letter-spacing: -0.2px; color: #111827;
    line-height: 1.1;
  }
  .tpl-classic .contact {
    margin: 8px 0 0;
    font-size: 12.5px; color: #1f2937;
    line-height: 1.4;
  }
  .tpl-classic .contact .bar { color: #9ca3af; margin: 0 6px; }

  .tpl-classic .section { margin-top: 14px; }
  .tpl-classic .section-title {
    font-size: 15px; font-weight: 700; color: #111827;
    margin: 0 0 4px;
    padding-bottom: 2px;
    border-bottom: 1px solid #111827;
    letter-spacing: -0.1px;
  }
  .tpl-classic .section-body { font-size: 12.5px; line-height: 1.45; color: #1f2937; }

  .tpl-classic .para { margin: 4px 0 0; text-align: justify; hyphens: auto; }

  .tpl-classic .entry { margin-top: 6px; }
  .tpl-classic .entry:first-child { margin-top: 2px; }
  .tpl-classic .entry-head {
    display: flex; justify-content: space-between; align-items: baseline;
    gap: 12px; flex-wrap: wrap;
    font-size: 13px;
  }
  .tpl-classic .entry-left { color: #111827; }
  .tpl-classic .entry-right { color: #1f2937; font-variant-numeric: tabular-nums; }

  .tpl-classic .bullets {
    margin: 2px 0 0;
    padding-left: 20px;
    color: #1f2937;
  }
  .tpl-classic .bullets li { margin: 2px 0; }
  .tpl-classic .bullets.plain { padding-left: 20px; }
  .tpl-classic .bullets code {
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 0.88em;
    background: #f3f4f6;
    padding: 0 3px;
    border-radius: 3px;
  }

  .tpl-classic .skills { display: flex; flex-direction: column; gap: 2px; }
  .tpl-classic .skill-row {
    display: grid; grid-template-columns: 150px 1fr;
    gap: 10px; font-size: 12.5px;
  }
  .tpl-classic .skill-group { font-weight: 700; color: #111827; }
  .tpl-classic .skill-items { color: #1f2937; }

  .tpl-classic.${PRINT_MEASURE_CLASS} .hdr { padding-right: 58px; padding-left: 58px; margin-bottom: 3px; }
  .tpl-classic.${PRINT_MEASURE_CLASS} .avatar { width: 58px; height: 58px; top: 0; }
  .tpl-classic.${PRINT_MEASURE_CLASS} .name { font-size: 20pt; }
  .tpl-classic.${PRINT_MEASURE_CLASS} .contact { font-size: 8pt; margin-top: 2px; }
  .tpl-classic.${PRINT_MEASURE_CLASS} .section { margin-top: 6px; }
  .tpl-classic.${PRINT_MEASURE_CLASS} .section-title { font-size: 11.55pt; margin-bottom: 1px; padding-bottom: 1px; }
  .tpl-classic.${PRINT_MEASURE_CLASS} .section-body { font-size: 9.85pt; line-height: 1.23; }
  .tpl-classic.${PRINT_MEASURE_CLASS} .para { font-size: 9.85pt; }
  .tpl-classic.${PRINT_MEASURE_CLASS} .entry { margin-top: 2px; }
  .tpl-classic.${PRINT_MEASURE_CLASS} .entry-head { font-size: 9.85pt; }
  .tpl-classic.${PRINT_MEASURE_CLASS} .entry-right { font-size: 9.35pt; }
  .tpl-classic.${PRINT_MEASURE_CLASS} .bullets { padding-left: 12px; margin-top: 0; }
  .tpl-classic.${PRINT_MEASURE_CLASS} .bullets li { margin: 0; }
  .tpl-classic.${PRINT_MEASURE_CLASS} .skill-row { font-size: 9.35pt; grid-template-columns: 112px 1fr; gap: 6px; }

  @media (max-width: 680px) {
    .tpl-classic.resume { padding: 28px 24px; margin: 14px; }
    .resume-stage .tpl-classic.resume { margin: 14px; }
    .tpl-classic .hdr { padding: 0; }
    .tpl-classic .avatar { position: static; display: block; margin: 0 auto 10px; }
    .tpl-classic .skill-row { grid-template-columns: 1fr; }
  }

  @media print {
    .tpl-classic.resume {
      width: 210mm;
      height: 297mm;
      min-height: 0;
      max-width: none;
      margin: 0;
      padding: 10mm 12mm;
      box-sizing: border-box;
      box-shadow: none; border: none;
      overflow: hidden;
      background: #fff;
    }
    .tpl-classic .hdr { padding-right: 58px; padding-left: 58px; margin-bottom: 3px; }
    .tpl-classic .avatar { width: 58px; height: 58px; top: 0; }
    .tpl-classic .name { font-size: 20pt; }
    .tpl-classic .contact { font-size: 8pt; margin-top: 2px; }
    .tpl-classic .section { margin-top: 6px; }
    .tpl-classic .section-title { font-size: 11.55pt; margin-bottom: 1px; padding-bottom: 1px; }
    .tpl-classic .section-body { font-size: 9.85pt; line-height: 1.23; }
    .tpl-classic .para { font-size: 9.85pt; }
    .tpl-classic .entry { margin-top: 2px; }
    .tpl-classic .entry-head { font-size: 9.85pt; }
    .tpl-classic .entry-right { font-size: 9.35pt; }
    .tpl-classic .bullets { padding-left: 12px; margin-top: 0; }
    .tpl-classic .bullets li { margin: 0; }
    .tpl-classic .skill-row { font-size: 9.35pt; grid-template-columns: 112px 1fr; gap: 6px; }
    .tpl-classic a { color: #111827; }
    .tpl-classic .entry, .tpl-classic .skill-row { page-break-inside: avoid; break-inside: avoid; }
  }
`

