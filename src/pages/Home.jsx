import Hero from '../components/sections/Hero'
import AboutProduct from '../components/sections/AboutProduct'
import HowItWorks from '../components/sections/HowItWorks'
import ProductDemo from '../components/sections/ProductDemo'
import Benefits from '../components/sections/Benefits'
import BeforeAfter from '../components/sections/BeforeAfter'
import SocialProof from '../components/sections/SocialProof'
import CTA from '../components/sections/CTA'
import WhoItsFor from '../components/sections/WhoItsFor'

export default function Home() {
  return (
    <>
      <Hero />
      <AboutProduct />
      <HowItWorks />
      <ProductDemo />
      <Benefits />
      <BeforeAfter />
      <WhoItsFor />
      <SocialProof />
      <CTA
        ctaLabel="See Pricing"
        ctaTo="/pricing"
        secondaryLabel="Talk to Our Team"
        secondaryTo="/contact"
      />
    </>
  )
}
