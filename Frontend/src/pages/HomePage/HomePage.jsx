import React from 'react'
import Hero from './Hero'
import PopularServices from './PopularServices'
import HowItWorks from './HowItWorks'
import Testimonials from './Testimonials'

function HomePage() {
  return (
    <div className='min-h-screen bg-gray-50 w-full'>

        <Hero />

        <PopularServices />

        <HowItWorks />

        <Testimonials />
    </div>
  )
}

export default HomePage