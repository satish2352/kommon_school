import { Link } from 'react-router-dom'

const variants = {
  primary: 'inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-sm shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
  secondary: 'inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border-2 border-blue-600 text-blue-600 font-semibold text-sm hover:bg-blue-50 transition-all duration-200',
  outlineWhite: 'inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border-2 border-white text-white font-semibold text-sm hover:bg-white hover:text-blue-700 transition-all duration-200',
  ghost: 'inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-blue-600 font-semibold text-sm hover:bg-blue-50 transition-all duration-200',
}

const sizes = {
  sm: 'px-4 py-2 text-xs',
  md: 'px-6 py-3 text-sm',
  lg: 'px-8 py-4 text-base',
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  href,
  to,
  onClick,
  className = '',
  ...props
}) {
  const classes = `${variants[variant]} ${className}`

  if (to) {
    return (
      <Link to={to} className={classes} {...props}>
        {children}
      </Link>
    )
  }

  if (href) {
    return (
      <a href={href} className={classes} {...props}>
        {children}
      </a>
    )
  }

  return (
    <button onClick={onClick} className={classes} {...props}>
      {children}
    </button>
  )
}
