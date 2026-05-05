import { useEffect } from 'react'
import AOS from 'aos'
import 'aos/dist/aos.css'
import AppRoutes from './routes/AppRoutes'
import { AuthProvider } from './context/AuthContext'

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
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}

export default App
