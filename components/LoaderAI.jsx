"use client"
import { useTheme } from 'next-themes';
import Image from 'next/image';
import React from 'react'

const LoaderAI = ({ showThinking }) => {
  const { theme } = useTheme();

  return (
    <div className="flex items-center gap-1 text-gray-400">
      <div className="loader-wrapper">
        <svg className="svg" viewBox="25 25 50 50">
          <circle className="circle" r="20" cy="50" cx="50" />
        </svg>

        <Image width={35} height={35} unoptimized src={`${theme == 'dark' ? '/logo2.png' : '/logo1.png'}`} alt="logo" className="loader-logo" />
      </div>

      <span className="text-sm">
        {showThinking ? "Thinking for better response..." : "Typing..."}
      </span>
    </div>
  )
}

export default LoaderAI