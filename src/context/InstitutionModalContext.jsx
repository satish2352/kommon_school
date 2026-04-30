import { createContext, useContext, useState } from 'react'

const InstitutionModalContext = createContext(null)

export function InstitutionModalProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <InstitutionModalContext.Provider value={{ isOpen, open: () => setIsOpen(true), close: () => setIsOpen(false) }}>
      {children}
    </InstitutionModalContext.Provider>
  )
}

export const useInstitutionModal = () => useContext(InstitutionModalContext)
