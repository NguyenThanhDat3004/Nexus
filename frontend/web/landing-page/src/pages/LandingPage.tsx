import { Grain, ScrollProgress, SiteBackground } from '../components/Backdrop'
import { Capabilities } from '../components/Capabilities'
import { FinalCta } from '../components/FinalCta'
import { Footer } from '../components/Footer'
import { Hero } from '../components/Hero'
import { NavBar } from '../components/NavBar'
import { Problem } from '../components/Problem'
import { Roles } from '../components/Roles'
import { Security } from '../components/Security'
import { Workflow } from '../components/Workflow'

export default function LandingPage() {
  return (
    <div className="relative isolate min-h-[100dvh] text-ink">
      <SiteBackground />
      <ScrollProgress />
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-[#0b0c1a] focus:px-4 focus:py-2"
      >
        Skip to content
      </a>
      <NavBar />
      <main id="main">
        <Hero />
        <Problem />
        <Workflow />
        <Capabilities />
        <Roles />
        <Security />
        <FinalCta />
      </main>
      <Footer />
      <Grain />
    </div>
  )
}
