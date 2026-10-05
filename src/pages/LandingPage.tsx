import Adoption from '../components/home/Adoption'
import Footer from '../components/layout/Footer'
import Navbar from '../components/layout/Navbar'
import Categories from '../components/home/Categories'
import CtaBanner from '../components/home/CtaBanner'
import Hero from '../components/home/Hero'
import HowItWorks from '../components/home/HowItWorks'
import Listings from '../components/home/Listings'
import Merchandise from '../components/home/Merchandise'
import Services from '../components/home/Services'
import Stats from '../components/home/Stats'
import Testimonials from '../components/home/Testimonials'

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Stats />
        <Categories />
        <Merchandise />
        <HowItWorks />
        <Listings />
        <Adoption />
        <Services />
        <Testimonials />
        <CtaBanner />
      </main>
      <Footer />
    </>
  )
}