import { useEffect } from 'react'
import AOS from 'aos'
import 'aos/dist/aos.css'
import AppRoutes from './routes/AppRoutes'
import { AuthProvider } from './context/AuthContext'
import { BrandingProvider } from './context/BrandingContext'

function App() {
  useEffect(() => {
    AOS.init({
      duration: 1000,
      easing: 'ease-in-out',
      once: true,
      offset: 80,
    })
  }, [])

  return (
    <BrandingProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrandingProvider>
  )
}

export default App
