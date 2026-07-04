"use client"

import { useApp } from '@/app/Context/UserContext'
import Analytics from '@/components/Analytics/Analytics';
import ApiClient from '@/components/ApiClient/ApiClient'
import { Suspense } from 'react'

function page() {
  const { activeElement } = useApp();
  return (
    <div className='w-full h-full shrink-0 flex '>
      {(activeElement === "apiClient" || activeElement === "collections") && (
        <Suspense fallback={
          <div className="flex-1 flex items-center justify-center bg-black text-text-muted text-xs font-mono">
            Loading Workspace...
          </div>
        }>
          {/* Api Client Page */}
          <ApiClient />
        </Suspense>
      )}

      {activeElement === "analytics" && (
        <Suspense fallback={
          <div className="flex-1 flex items-center justify-center bg-black text-text-muted text-xs font-mono">
            Loading Analytics...
          </div>
        }>
          {/* Analytics Page */}
          <Analytics />
        </Suspense>
      )}

    </div>
  )
}

export default page