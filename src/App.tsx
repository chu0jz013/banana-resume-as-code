import { Fragment, useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import defaultResumeYaml from '../resume.yaml?raw'
import { resume as generatedResume } from './resume.generated'
import { parseResumeYaml, ResumeYamlError } from './resumeSchema'
import type { ResumeData, RichText, RichTextSpan } from './resumeTypes'
import './App.css'

type FontOption = {
  id: string
  label: string
  family: string
  note: string
}

const FONT_OPTIONS: FontOption[] = [
  {
    id: 'inter',
    label: 'Inter',
    family: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    note: 'Modern - neutral sans - SaaS-standard',
  },
  {
    id: 'ibm-plex',
    label: 'IBM Plex Sans',
    family: '"IBM Plex Sans", "Segoe UI", Roboto, sans-serif',
    note: 'Technical character - DevOps-friendly',
  },
  {
    id: 'manrope',
    label: 'Manrope',
    family: '"Manrope", "Inter", -apple-system, sans-serif',
    note: 'Geometric - friendly - product-design vibe',
  },
  {
    id: 'source-serif',
    label: 'Source Serif 4',
    family: '"Source Serif 4", Georgia, "Times New Roman", serif',
    note: 'Modern serif - bookish but clean',
  },
  {
    id: 'eb-garamond',
    label: 'EB Garamond',
    family: '"EB Garamond", Cambria, Georgia, serif',
    note: 'Classic - LaTeX / academic feel',
  },
]

const GOOGLE_FONTS_HREF =
  'https://fonts.googleapis.com/css2' +
  '?family=Inter:wght@400;500;600;700' +
  '&family=IBM+Plex+Sans:wght@400;500;600;700' +
  '&family=Manrope:wght@400;500;600;700' +
  '&family=Source+Serif+4:wght@400;600;700' +
  '&family=EB+Garamond:wght@400;600;700' +
  '&display=swap'

const FONT_STORAGE_KEY = 'resume-font-id'
const YAML_STORAGE_KEY = 'resume-yaml-draft'

const A4_PAGE_HEIGHT_PX = 1123
const MIN_FIT_SCALE = 0.72
const RESUME_SELECTOR = '.resume'
const PRINT_MEASURE_CLASS = 'resume-print-measure'
const AVATAR_SRC = '/avatar.jpg'

type YamlStatus =
  | { kind: 'idle'; message: string }
  | { kind: 'success'; message: string }
  | { kind: 'error'; message: string; issues: string[] }

declare global {
  interface Window {
    resumeAsCode?: {
      fitToOnePage: () => number
      resetZoom: () => void
    }
  }
}

function useGoogleFonts() {
  useEffect(() => {
    const id = 'google-fonts-resume'
    if (document.getElementById(id)) return
    const preconnect1 = document.createElement('link')
    preconnect1.rel = 'preconnect'
    preconnect1.href = 'https://fonts.googleapis.com'
    document.head.appendChild(preconnect1)
    const preconnect2 = document.createElement('link')
    preconnect2.rel = 'preconnect'
    preconnect2.href = 'https://fonts.gstatic.com'
    preconnect2.crossOrigin = 'anonymous'
    document.head.appendChild(preconnect2)
    const link = document.createElement('link')
    link.id = id
    link.rel = 'stylesheet'
    link.href = GOOGLE_FONTS_HREF
    document.head.appendChild(link)
  }, [])
}

function fitResumeToOnePage(): number {
  const resumeElement = document.querySelector(RESUME_SELECTOR) as HTMLElement | null
  if (!resumeElement) return 1
  resumeElement.style.zoom = '1'
  const measured = measurePrintResumeHeight(resumeElement)
  if (measured <= A4_PAGE_HEIGHT_PX) {
    resumeElement.style.zoom = '1'
    return 1
  }
  const scale = Math.max(MIN_FIT_SCALE, A4_PAGE_HEIGHT_PX / measured)
  resumeElement.style.zoom = String(scale)
  return scale
}

function measurePrintResumeHeight(resumeElement: HTMLElement) {
  const clone = resumeElement.cloneNode(true) as HTMLElement
  clone.classList.add(PRINT_MEASURE_CLASS)
  clone.style.zoom = '1'
  document.body.appendChild(clone)
  const measured = Math.ceil(clone.getBoundingClientRect().height)
  clone.remove()
  return measured
}

function resetResumeZoom() {
  const resumeElement = document.querySelector(RESUME_SELECTOR) as HTMLElement | null
  if (resumeElement) resumeElement.style.zoom = ''
}

function readStoredYaml() {
  if (typeof window === 'undefined') return null

  try {
    return window.localStorage.getItem(YAML_STORAGE_KEY)
  } catch {
    return null
  }
}

function writeStoredYaml(yamlText: string) {
  try {
    window.localStorage.setItem(YAML_STORAGE_KEY, yamlText)
  } catch {
    /* ignore */
  }
}

function clearStoredYaml() {
  try {
    window.localStorage.removeItem(YAML_STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

function createInitialYamlStatus(): YamlStatus {
  return readStoredYaml()
    ? { kind: 'idle', message: 'Draft loaded. Click Apply YAML to render.' }
    : { kind: 'idle', message: 'Loaded from resume.yaml.' }
}

function App() {
  useGoogleFonts()

  const [fontId, setFontId] = useState<string>(() => {
    if (typeof window === 'undefined') return 'inter'
    return window.localStorage.getItem(FONT_STORAGE_KEY) || 'inter'
  })

  const [draftYaml, setDraftYaml] = useState<string>(() => readStoredYaml() ?? defaultResumeYaml)
  const [activeResume, setActiveResume] = useState<ResumeData>(generatedResume)
  const [yamlStatus, setYamlStatus] = useState<YamlStatus>(() => createInitialYamlStatus())
  const [fitInfo, setFitInfo] = useState<{ scale: number; manual: boolean } | null>(null)

  useEffect(() => {
    try {
      window.localStorage.setItem(FONT_STORAGE_KEY, fontId)
    } catch {
      /* ignore */
    }
  }, [fontId])

  useEffect(() => {
    function onBeforePrint() {
      resetResumeZoom()
      setFitInfo({ scale: 1, manual: false })
    }
    function onAfterPrint() {
      resetResumeZoom()
    }
    window.addEventListener('beforeprint', onBeforePrint)
    window.addEventListener('afterprint', onAfterPrint)
    return () => {
      window.removeEventListener('beforeprint', onBeforePrint)
      window.removeEventListener('afterprint', onAfterPrint)
    }
  }, [])

  useEffect(() => {
    window.resumeAsCode = {
      fitToOnePage: fitResumeToOnePage,
      resetZoom: resetResumeZoom,
    }

    return () => {
      delete window.resumeAsCode
    }
  }, [])

  function handlePrint() {
    resetResumeZoom()
    requestAnimationFrame(() => window.print())
  }

  function handlePreviewFit() {
    const scale = fitResumeToOnePage()
    setFitInfo({ scale, manual: true })
  }

  function handleReset() {
    resetResumeZoom()
    setFitInfo(null)
  }

  function handleDraftYamlChange(nextYaml: string) {
    setDraftYaml(nextYaml)
    writeStoredYaml(nextYaml)
    setYamlStatus({ kind: 'idle', message: 'Draft changed. Click Apply YAML to render.' })
  }

  function handleApplyYaml() {
    try {
      const parsedResume = parseResumeYaml(draftYaml)
      setActiveResume(parsedResume)
      writeStoredYaml(draftYaml)
      resetResumeZoom()
      setFitInfo(null)
      setYamlStatus({ kind: 'success', message: 'YAML applied to preview.' })
    } catch (error) {
      if (error instanceof ResumeYamlError) {
        setYamlStatus({
          kind: 'error',
          message: error.message,
          issues: error.issues,
        })
        return
      }

      setYamlStatus({
        kind: 'error',
        message: 'Could not parse YAML.',
        issues: [error instanceof Error ? error.message : String(error)],
      })
    }
  }

  function handleResetYaml() {
    setDraftYaml(defaultResumeYaml)
    setActiveResume(generatedResume)
    clearStoredYaml()
    resetResumeZoom()
    setFitInfo(null)
    setYamlStatus({ kind: 'idle', message: 'Reset to resume.yaml.' })
  }

  const activeFont = FONT_OPTIONS.find((font) => font.id === fontId) ?? FONT_OPTIONS[0]

  return (
    <div className="resume-root">
      <style>{css}</style>

      <div className="toolbar">
        <div className="toolbar-inner">
          <span className="toolbar-title">resume.yaml</span>
          <div className="toolbar-actions">
            <label className="font-picker">
              <span className="font-picker-label">Font</span>
              <select
                value={fontId}
                onChange={(event) => setFontId(event.target.value)}
                aria-label="Resume font"
              >
                {FONT_OPTIONS.map((font) => (
                  <option key={font.id} value={font.id}>
                    {font.label} - {font.note}
                  </option>
                ))}
              </select>
            </label>
            {fitInfo && (
              <span className="fit-badge" title="Current scale applied to fit 1 page">
                {fitInfo.manual ? 'Preview' : 'Auto-fit'}: {Math.round(fitInfo.scale * 100)}%
                <button
                  type="button"
                  className="fit-reset"
                  onClick={handleReset}
                  aria-label="Reset zoom"
                >
                  x
                </button>
              </span>
            )}
            <button className="ghost-btn" onClick={handlePreviewFit} type="button">
              Preview fit
            </button>
            <span className="print-hint">
              Tip: uncheck "Headers and footers" in print dialog for a clean PDF.
            </span>
            <button className="print-btn" onClick={handlePrint} type="button">
              Download PDF
            </button>
          </div>
        </div>
      </div>

      <div className="resume-workbench">
        <aside className="yaml-panel" aria-label="YAML editor">
          <div className="yaml-panel-head">
            <span className="yaml-panel-title">YAML</span>
            <div className="yaml-panel-actions">
              <button className="ghost-btn" type="button" onClick={handleResetYaml}>
                Reset
              </button>
              <button className="print-btn" type="button" onClick={handleApplyYaml}>
                Apply YAML
              </button>
            </div>
          </div>
          <textarea
            className="yaml-editor"
            value={draftYaml}
            onChange={(event) => handleDraftYamlChange(event.target.value)}
            spellCheck={false}
            aria-label="Resume YAML"
          />
          <div className={`yaml-status ${yamlStatus.kind}`}>
            <span>{yamlStatus.message}</span>
            {yamlStatus.kind === 'error' && (
              <ul>
                {yamlStatus.issues.map((issue) => (
                  <li key={issue}>{issue}</li>
                ))}
              </ul>
            )}
          </div>
        </aside>

        <div className="resume-stage">
          <main
            className="resume"
            style={{ ['--resume-font' as string]: activeFont.family } as CSSProperties}
          >
        <header className="hdr">
          <img className="avatar" src={AVATAR_SRC} alt={activeResume.profile.name} />
          <h1 className="name">{activeResume.profile.name}</h1>
          <p className="contact">
            {activeResume.profile.contacts.map((contact, index) => (
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
          <p className="para">{renderRichText(activeResume.summary)}</p>
        </Section>

        <Section title="Experience">
          {activeResume.experience.map((role) => (
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
          {activeResume.projects.map((project) => (
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
            {activeResume.skills.map((skill) => (
              <div className="skill-row" key={skill.group}>
                <span className="skill-group">{skill.group}</span>
                <span className="skill-items">{skill.items}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Education">
          {activeResume.education.map((entry) => (
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
            {activeResume.certifications.map((certification) => (
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
        </div>
      </div>
    </div>
  )
}

function renderRichText(richText: RichText) {
  return richText.map((span, index) => <Fragment key={index}>{renderRichTextSpan(span)}</Fragment>)
}

function renderRichTextSpan(span: RichTextSpan): ReactNode {
  let node: ReactNode = span.text

  if (span.marks?.includes('code')) {
    node = <code>{node}</code>
  }

  if (span.marks?.includes('bold')) {
    node = <b>{node}</b>
  }

  if (span.href) {
    node = (
      <a
        href={span.href}
        target={isExternalHref(span.href) ? '_blank' : undefined}
        rel={isExternalHref(span.href) ? 'noreferrer' : undefined}
      >
        {node}
      </a>
    )
  }

  return node
}

function isExternalHref(href: string) {
  return href.startsWith('http://') || href.startsWith('https://')
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="section">
      <h2 className="section-title">{title}</h2>
      <div className="section-body">{children}</div>
    </section>
  )
}

const css = `
  :root { color-scheme: light; }
  body:has(.resume-root) {
    margin: 0;
    background: #e5e7eb;
    color: #111827;
    font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-feature-settings: "liga", "kern";
    -webkit-font-smoothing: antialiased;
  }
  .resume {
    font-family: var(--resume-font, "Inter", -apple-system, "Segoe UI", sans-serif);
  }
  #root:has(.resume-root) {
    width: 100%;
    max-width: none;
    min-height: 100vh;
    margin: 0;
    padding: 0;
    border: 0;
    display: block;
    box-sizing: border-box;
    text-align: left;
  }
  .resume-root { width: 100%; min-height: 100vh; }
  .resume-root a { color: #111827; text-decoration: underline; text-underline-offset: 2px; }
  .resume-root a:hover { color: #1d4ed8; }

  .toolbar {
    position: sticky; top: 0; z-index: 10;
    background: rgba(255,255,255,0.9);
    backdrop-filter: saturate(1.2) blur(6px);
    border-bottom: 1px solid #d1d5db;
    font-family: -apple-system, "Segoe UI", Inter, sans-serif;
  }
  .toolbar-inner {
    max-width: 820px; margin: 0 auto;
    padding: 10px 20px;
    display: flex; align-items: center; justify-content: space-between; gap: 16px;
  }
  .toolbar-title {
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 13px; color: #6b7280;
  }
  .toolbar-actions { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; justify-content: flex-end; }
  .font-picker {
    display: inline-flex; align-items: center; gap: 6px;
    font-size: 12px; color: #374151;
  }
  .font-picker-label {
    font-weight: 600; color: #6b7280; text-transform: uppercase;
    letter-spacing: 0.06em; font-size: 10.5px;
  }
  .font-picker select {
    font: inherit; font-size: 12.5px;
    padding: 5px 8px;
    border: 1px solid #d1d5db; border-radius: 6px;
    background: #fff; color: #111827;
    cursor: pointer;
    min-width: 220px;
  }
  .font-picker select:hover { border-color: #9ca3af; }
  .font-picker select:focus-visible { outline: 2px solid #1d4ed8; outline-offset: 1px; }
  .print-hint {
    font-size: 11.5px; color: #6b7280; font-style: italic;
    max-width: 320px; text-align: right; line-height: 1.3;
  }
  .print-btn {
    background: #111827; color: #fff; border: none;
    padding: 8px 14px; border-radius: 6px;
    font-size: 13px; font-weight: 500; cursor: pointer;
    white-space: nowrap;
  }
  .print-btn:hover { background: #1d4ed8; }
  .ghost-btn {
    background: #fff; color: #111827; border: 1px solid #d1d5db;
    padding: 7px 12px; border-radius: 6px;
    font-size: 12.5px; font-weight: 500; cursor: pointer;
    white-space: nowrap;
  }
  .ghost-btn:hover { border-color: #9ca3af; background: #f9fafb; }
  .fit-badge {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 4px 4px 4px 10px;
    background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0;
    border-radius: 999px;
    font-size: 11.5px; font-weight: 600;
    white-space: nowrap;
  }
  .fit-reset {
    background: transparent; border: none; color: #065f46;
    cursor: pointer; font-size: 14px; line-height: 1;
    padding: 0 6px; border-radius: 999px;
  }
  .fit-reset:hover { background: #d1fae5; }

  .resume-workbench {
    width: 100%;
    margin: 24px 0 48px;
    padding: 0 28px;
    box-sizing: border-box;
    display: grid;
    grid-template-columns: minmax(360px, 560px) minmax(0, 1fr);
    gap: 24px;
    align-items: start;
  }
  .yaml-panel {
    position: sticky;
    top: 68px;
    background: #fff;
    border: 1px solid #d1d5db;
    box-shadow: 0 1px 2px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.06);
    padding: 14px;
    min-width: 0;
  }
  .yaml-panel-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 10px;
  }
  .yaml-panel-title {
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 13px;
    font-weight: 700;
    color: #111827;
  }
  .yaml-panel-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    justify-content: flex-end;
  }
  .yaml-editor {
    width: 100%;
    min-height: 64vh;
    resize: vertical;
    box-sizing: border-box;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    padding: 12px;
    background: #f9fafb;
    color: #111827;
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 12px;
    line-height: 1.45;
    tab-size: 2;
  }
  .yaml-editor:focus-visible {
    outline: 2px solid #1d4ed8;
    outline-offset: 1px;
    background: #fff;
  }
  .yaml-status {
    margin-top: 10px;
    font-size: 12px;
    line-height: 1.4;
    color: #4b5563;
  }
  .yaml-status.success { color: #065f46; }
  .yaml-status.error { color: #991b1b; }
  .yaml-status ul {
    margin: 6px 0 0;
    padding-left: 18px;
  }
  .yaml-status li { margin: 2px 0; }
  .resume-stage {
    min-width: 0;
    display: flex;
    justify-content: center;
  }
  .resume-stage .resume {
    margin: 0;
  }

  .resume {
    max-width: 820px;
    margin: 28px auto 48px;
    background: #fff;
    padding: 56px 64px;
    box-shadow: 0 1px 2px rgba(0,0,0,.05), 0 8px 24px rgba(0,0,0,.08);
    border: 1px solid #d1d5db;
  }

  .${PRINT_MEASURE_CLASS} {
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

  .hdr {
    position: relative;
    text-align: center;
    padding-right: 96px;
    padding-left: 96px;
    margin-bottom: 6px;
  }
  .avatar {
    position: absolute; top: -4px; right: 0;
    width: 86px; height: 86px;
    border-radius: 50%;
    object-fit: cover;
    border: 1px solid #d1d5db;
  }
  .name {
    margin: 0;
    font-size: 34px; font-weight: 700;
    letter-spacing: -0.2px; color: #111827;
    line-height: 1.1;
  }
  .contact {
    margin: 8px 0 0;
    font-size: 12.5px; color: #1f2937;
    line-height: 1.4;
  }
  .contact .bar { color: #9ca3af; margin: 0 6px; }

  .section { margin-top: 14px; }
  .section-title {
    font-size: 15px; font-weight: 700; color: #111827;
    margin: 0 0 4px;
    padding-bottom: 2px;
    border-bottom: 1px solid #111827;
    letter-spacing: -0.1px;
  }
  .section-body { font-size: 12.5px; line-height: 1.45; color: #1f2937; }

  .para { margin: 4px 0 0; text-align: justify; hyphens: auto; }

  .entry { margin-top: 6px; }
  .entry:first-child { margin-top: 2px; }
  .entry-head {
    display: flex; justify-content: space-between; align-items: baseline;
    gap: 12px; flex-wrap: wrap;
    font-size: 13px;
  }
  .entry-left { color: #111827; }
  .entry-right { color: #1f2937; font-variant-numeric: tabular-nums; }

  .bullets {
    margin: 2px 0 0;
    padding-left: 20px;
    color: #1f2937;
  }
  .bullets li { margin: 2px 0; }
  .bullets.plain { padding-left: 20px; }
  .bullets code {
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 0.88em;
    background: #f3f4f6;
    padding: 0 3px;
    border-radius: 3px;
  }

  .skills { display: flex; flex-direction: column; gap: 2px; }
  .skill-row {
    display: grid; grid-template-columns: 150px 1fr;
    gap: 10px; font-size: 12.5px;
  }
  .skill-group { font-weight: 700; color: #111827; }
  .skill-items { color: #1f2937; }

  .${PRINT_MEASURE_CLASS} .hdr { padding-right: 58px; padding-left: 58px; margin-bottom: 3px; }
  .${PRINT_MEASURE_CLASS} .avatar { width: 58px; height: 58px; top: 0; }
  .${PRINT_MEASURE_CLASS} .name { font-size: 20pt; }
  .${PRINT_MEASURE_CLASS} .contact { font-size: 8pt; margin-top: 2px; }
  .${PRINT_MEASURE_CLASS} .section { margin-top: 6px; }
  .${PRINT_MEASURE_CLASS} .section-title { font-size: 11.55pt; margin-bottom: 1px; padding-bottom: 1px; }
  .${PRINT_MEASURE_CLASS} .section-body { font-size: 9.85pt; line-height: 1.23; }
  .${PRINT_MEASURE_CLASS} .para { font-size: 9.85pt; }
  .${PRINT_MEASURE_CLASS} .entry { margin-top: 2px; }
  .${PRINT_MEASURE_CLASS} .entry-head { font-size: 9.85pt; }
  .${PRINT_MEASURE_CLASS} .entry-right { font-size: 9.35pt; }
  .${PRINT_MEASURE_CLASS} .bullets { padding-left: 12px; margin-top: 0; }
  .${PRINT_MEASURE_CLASS} .bullets li { margin: 0; }
  .${PRINT_MEASURE_CLASS} .skill-row { font-size: 9.35pt; grid-template-columns: 112px 1fr; gap: 6px; }

  @media (max-width: 1100px) {
    .resume-workbench {
      width: min(100% - 28px, 820px);
      display: block;
      margin: 14px auto 32px;
    }
    .yaml-panel { position: static; margin-bottom: 14px; }
    .yaml-editor { min-height: 360px; }
  }

  @media (max-width: 680px) {
    .resume-workbench { width: 100%; margin: 14px 0 32px; }
    .yaml-panel { margin: 0 14px 14px; }
    .yaml-panel-head { align-items: flex-start; flex-direction: column; }
    .yaml-panel-actions { justify-content: flex-start; }
    .yaml-editor { min-height: 320px; }
    .resume { padding: 28px 24px; margin: 14px; }
    .resume-stage .resume { margin: 14px; }
    .hdr { padding: 0; }
    .avatar { position: static; display: block; margin: 0 auto 10px; }
    .skill-row { grid-template-columns: 1fr; }
  }

  @media print {
    @page { size: A4 portrait; margin: 0; }
    html, body, #root {
      width: 210mm !important;
      height: 297mm !important;
      min-height: 0 !important;
      margin: 0 !important;
      padding: 0 !important;
      background: #fff !important;
      overflow: hidden !important;
    }
    #root:has(.resume-root) {
      max-width: none;
      margin: 0;
      padding: 0;
    }
    .resume-root {
      width: 210mm;
      height: 297mm;
      min-height: 0;
      background: #fff;
      overflow: hidden;
    }
    .resume-workbench {
      width: 210mm;
      height: 297mm;
      margin: 0;
      padding: 0;
      display: block;
      overflow: hidden;
    }
    .resume-stage {
      width: 210mm;
      height: 297mm;
      margin: 0;
      padding: 0;
      display: block;
      overflow: hidden;
    }
    .toolbar, .yaml-panel, .print-hint, .fit-badge, .ghost-btn { display: none !important; }
    .resume {
      width: 210mm;
      height: 297mm;
      min-height: 0;
      max-width: none;
      margin: 0;
      padding: 10mm 12mm;
      box-sizing: border-box;
      box-shadow: none; border: none;
      overflow: hidden;
    }
    * {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .hdr { padding-right: 58px; padding-left: 58px; margin-bottom: 3px; }
    .avatar { width: 58px; height: 58px; top: 0; }
    .name { font-size: 20pt; }
    .contact { font-size: 8pt; margin-top: 2px; }
    .section { margin-top: 6px; }
    .section-title { font-size: 11.55pt; margin-bottom: 1px; padding-bottom: 1px; }
    .section-body { font-size: 9.85pt; line-height: 1.23; }
    .para { font-size: 9.85pt; }
    .entry { margin-top: 2px; }
    .entry-head { font-size: 9.85pt; }
    .entry-right { font-size: 9.35pt; }
    .bullets { padding-left: 12px; margin-top: 0; }
    .bullets li { margin: 0; }
    .skill-row { font-size: 9.35pt; grid-template-columns: 112px 1fr; gap: 6px; }
    a { color: #111827; }
    .entry, .skill-row { page-break-inside: avoid; break-inside: avoid; }
  }
`

export default App
