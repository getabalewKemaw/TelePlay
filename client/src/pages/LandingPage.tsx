import { LandingNavbar } from '../components/Landing/LandingNavbar'
import { LandingHero } from '../components/Landing/LandingHero'
import { LandingFeatures } from '../components/Landing/LandingFeatures'
import { LandingHowItWorks } from '../components/Landing/LandingHowItWorks'
import { LandingTechnicalSpecs } from '../components/Landing/LandingTechnicalSpecs'
import { LandingWhatItSolves } from '../components/Landing/LandingWhatItSolves'
import { LandingCTA } from '../components/Landing/LandingCTA'
import { LandingFooter } from '../components/Landing/LandingFooter'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[url('/bg-image.png')] bg-cover bg-center bg-fixed text-coffee-Dark font-sans relative overflow-x-hidden selection:bg-coffee-200">
      {/* Background Decorative Blurs */}
      <div className="absolute top-0 right-[10%] w-[50vw] h-[50vw] max-w-[40rem] max-h-[40rem] bg-coffee-300/20 blur-[120px] rounded-full mix-blend-multiply pointer-events-none" />
      <div className="absolute top-[20%] left-[-10%] w-[40vw] h-[40vw] max-w-[35rem] max-h-[35rem] bg-coffee-accent/20 blur-[120px] rounded-full mix-blend-multiply pointer-events-none" />
      <div className="absolute bottom-[20%] right-[20%] w-[35vw] h-[35vw] max-w-[30rem] max-h-[30rem] bg-coffee-200/20 blur-[120px] rounded-full mix-blend-multiply pointer-events-none" />

      <LandingNavbar />
      <LandingHero />
      <LandingFeatures />
      <LandingTechnicalSpecs />
      <LandingHowItWorks />
      <LandingWhatItSolves />
      <LandingCTA />
      <LandingFooter />
    </div>
  )
}
