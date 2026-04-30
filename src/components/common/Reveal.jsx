import { useScrollReveal } from '../../hooks/useScrollReveal'

/**
 * Reveal — wraps children with a scroll-triggered entrance animation.
 *
 * variant: 'up' | 'down' | 'left' | 'right' | 'scale' | 'fade'
 * delay:   100 | 150 | 200 | 250 | 300 | 400 | 500 | 600  (ms)
 * as:      HTML tag string (default 'div')
 */
export default function Reveal({
  children,
  variant = 'up',
  delay = 0,
  as: Tag = 'div',
  className = '',
  threshold,
  rootMargin,
  ...rest
}) {
  const ref = useScrollReveal({ threshold, rootMargin })

  const delayClass = delay ? `reveal-delay-${delay}` : ''

  return (
    <Tag
      ref={ref}
      className={`reveal reveal-${variant} ${delayClass} ${className}`.trim()}
      {...rest}
    >
      {children}
    </Tag>
  )
}
