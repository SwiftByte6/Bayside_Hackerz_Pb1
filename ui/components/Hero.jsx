import Image from 'next/image'
import React from 'react'
import Button from './Button'

const Hero = () => {
  return (
    <div className='h-screen bg-black relative w-full'>
        {/* Hero Content */}
        <div className='relative h-[70vh] z-10 flex flex-col items-center justify-center px-4 text-center'>
          {/* Badge */}
          <div className='inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-gray-700 bg-gray-900/50 backdrop-blur-sm mb-8'>
            <span className='text-gray-400 text-sm'>AI Production Readiness Scanner</span>
          </div>
          
          {/* Headline */}
          <h1 className='text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 max-w-4xl'>
            Audit the <span className='text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-purple-600'>Intelligence</span> Behind Your Code.
          </h1>
          
          {/* Subtitle */}
          <p className='text-gray-400 text-sm md:text-base max-w-2xl mb-8'>
            AI-generated code moves fast — but risk moves faster.<br />
            Scan your repository for secrets, vulnerable dependencies, LLM attack vectors, and compliance gaps in seconds.
          </p>
          
          {/* CTA Buttons */}
          <div className='flex flex-wrap mt-4 gap-4 justify-center'>
            <Button text="Run Free Audit" href="/upload" variant="main" />
            <Button text="See Live Scan" href="/results" variant="hollow" />
          </div>
        </div>
        
        <Image
        src={'/bottom.png'}
        width={1920}
        height={1080}
        className='bottom-0 absolute z-10'
        />
        {/* Video Background - Bottom Half */}
        <div className='absolute bottom-0 left-0 w-screen h-[80vh] pointer-events-none overflow-hidden'>
          <video
            src="/HeroVedio.mp4"
            autoPlay
            loop
            muted
            playsInline
            className='w-full h-full object-contain scale-100'
            style={{
              maskImage: 'linear-gradient(to bottom, transparent 0%, black 10%)',
              WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 10%)',
            }}
          />
        </div>
    </div>
  )
}

export default Hero