import { Fragment, type ReactNode } from 'react'
import type { RichText, RichTextSpan } from '../resumeTypes'

export const AVATAR_SRC = '/avatar.jpg'
export const PRINT_MEASURE_CLASS = 'resume-print-measure'

export function isExternalHref(href: string) {
  return href.startsWith('http://') || href.startsWith('https://')
}

export function renderRichText(richText: RichText) {
  return richText.map((span, index) => (
    <Fragment key={index}>{renderRichTextSpan(span)}</Fragment>
  ))
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
