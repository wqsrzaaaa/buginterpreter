import React from 'react'

const LoaderAI = ({showThinking}) => {
  return (
    <div className="flex items-center gap-1 text-gray-400">
      <span className="w-1 h-1 bg-gray-500 rounded-full animate-bounce delay-150"></span>
      <span className="w-1 h-1 bg-gray-500 rounded-full animate-bounce delay-300"></span>
      <span className="w-1 h-1 bg-gray-500 rounded-full animate-bounce delay-450"></span>
      <span className="text-sm">
        {showThinking ? "Thinking for better response..." : "Typing..."}
      </span>
    </div>
  )
}

export default LoaderAI