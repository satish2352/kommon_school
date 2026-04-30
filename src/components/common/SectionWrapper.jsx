export default function SectionWrapper({ children, className = '', id = '', bg = 'white' }) {
  const backgrounds = {
    white: 'bg-white',
    gray: 'bg-gray-50',
    dark: 'bg-gray-900',
    blue: 'bg-gradient-to-br from-blue-600 to-indigo-700',
    subtle: 'bg-gradient-to-br from-blue-50 to-indigo-50',
  }

  return (
    <section
      id={id}
      className={`${backgrounds[bg]} ${className}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 lg:py-20">
        {children}
      </div>
    </section>
  )
}
