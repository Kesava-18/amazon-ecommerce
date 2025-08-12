import React from 'react'

const LoadingSpinner = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        <span className="text-gray-600 font-medium">Loading...</span>
      </div>
    </div>
  )
}

export default LoadingSpinner