"use client"

import { useApp } from '@/app/Context/UserContext'
import Analytics from '@/components/Analytics/Analytics';
import ApiClient from '@/components/ApiClient/ApiClient'
import EnvironmentsManager from '@/components/Environments/EnvironmentsManager';
import { Suspense } from 'react';
import { userProductTour } from '@/lib/userProductTour';

function Page() {
  const { activeElement, activeRequest } = useApp();
  userProductTour(activeRequest);

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

      {activeElement === "environments" && (
        <Suspense fallback={
          <div className="flex-1 flex items-center justify-center bg-black text-text-muted text-xs font-mono">
            Loading Environments...
          </div>
        }>
          {/* Environments Page */}
          <EnvironmentsManager />
        </Suspense>
      )}
    </div>
  )
}

export default Page;