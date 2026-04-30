const contacts = [
  {
    label: 'Email',
    value: 'info@sumagoinfotech.com',
    href: 'mailto:info@sumagoinfotech.com',
    bg: 'bg-blue-50',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    labelColor: 'text-blue-500',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    label: 'Phone',
    value: '+91 98765 43210',
    href: 'tel:+919876543210',
    bg: 'bg-indigo-50',
    iconBg: 'bg-indigo-100',
    iconColor: 'text-indigo-600',
    labelColor: 'text-indigo-500',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
      </svg>
    ),
  },
  {
    label: 'Address',
    value: 'Nashik, Maharashtra, India',
    href: null,
    bg: 'bg-purple-50',
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
    labelColor: 'text-purple-500',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
]

export default function ContactTabs() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {contacts.map((c) => (
        <div
          key={c.label}
          className={`${c.bg} rounded-2xl p-4 sm:p-5 flex sm:flex-col flex-row items-center sm:justify-center sm:text-center gap-4 sm:gap-3 hover:shadow-md transition-all duration-200 cursor-default sm:min-h-[130px]`}
        >
          <div className={`w-11 h-11 rounded-xl ${c.iconBg} flex items-center justify-center ${c.iconColor} flex-shrink-0`}>
            {c.icon}
          </div>
          <div className="w-full">
            <div className={`text-[10px] font-bold uppercase tracking-widest ${c.labelColor} mb-1.5`}>{c.label}</div>
            {c.href ? (
              <a href={c.href} className="text-gray-800 font-semibold text-xs leading-relaxed hover:underline break-words hyphens-auto block">
                {c.value}
              </a>
            ) : (
              <p className="text-gray-800 font-semibold text-xs leading-relaxed break-words">{c.value}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
