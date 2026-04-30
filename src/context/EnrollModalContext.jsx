import { createContext, useContext, useState } from 'react'

const EnrollModalContext = createContext(null)

export function EnrollModalProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <EnrollModalContext.Provider value={{ isOpen, open: () => setIsOpen(true), close: () => setIsOpen(false) }}>
      {children}
    </EnrollModalContext.Provider>
  )
}

export const useEnrollModal = () => useContext(EnrollModalContext)
