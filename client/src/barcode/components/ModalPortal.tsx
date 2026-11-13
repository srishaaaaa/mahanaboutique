import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'

/**
 * Renders a pop-up directly under <body>, inside the `.bc` scope that carries the barcode screens' Tailwind styles and theme variables.
 * Pop-ups opened from inside a scrolling area are otherwise clipped on phones.
 */
export function ModalPortal({ children }: { children: ReactNode }) {
  if (typeof document === 'undefined') return <>{children}</>
  return createPortal(<div className="bc">{children}</div>, document.body)
}
