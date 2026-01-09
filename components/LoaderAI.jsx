"use client"
import { useTheme } from 'next-themes';
import Image from 'next/image';
import React from 'react'

const LoaderAI = ({ showThinking }) => {
  const { theme } = useTheme();

  return (
    <div className="flex items-center gap-1 text-gray-400">
      <div className='relative flex items-center justify-center'>
        <div className="traffic-loader">
      </div>
        <Image 
        src={theme === "dark" ? "/logo2.png" : "/logo1.png"}
        alt="logo"
        className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
        width={35}
        height={35}
      />
      </div>
      <span className="text-sm">
        {showThinking ? "Thinking for better response..." : "Typing..."}
      </span>
    </div>
  )
}

export default LoaderAI