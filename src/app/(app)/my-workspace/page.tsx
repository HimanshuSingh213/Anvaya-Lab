import ApiClient from '@/components/ApiClient/ApiClient'
import React, { Suspense } from 'react'

function page() {
  return (
    <div className='w-full h-full shrink-0 flex '>
      {/* Api Client Page */}
      <Suspense fallback={
        <div className="flex-1 flex items-center justify-center bg-black text-text-muted text-xs font-mono">
          Loading Workspace...
        </div>
      }>
        <ApiClient />
      </Suspense>
    </div>
  )
}

export default page