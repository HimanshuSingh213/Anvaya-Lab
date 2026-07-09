"use client"

import { useApp } from '@/app/Context/UserContext'
import Analytics from '@/components/Analytics/Analytics';
import ApiClient from '@/components/ApiClient/ApiClient'
import EnvironmentsManager from '@/components/Environments/EnvironmentsManager';
import { Suspense } from 'react';
import { userProductTour } from '@/lib/userProductTour';
import SettingsManager from '@/components/settings/SettingsManager';
import { Monitor } from 'lucide-react';

function Page() {
  const { activeElement, activeRequest } = useApp();
  userProductTour(activeRequest);

  return (
    <div className='w-full h-full shrink-0 flex '>
      {activeElement === "apiClient" && (
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

      {activeElement === "settings" && <SettingsManager />}

      {/* Mobile / Tablet Screen Blocker */}
      <div className="lg:hidden fixed inset-0 z-99999999 bg-bg-black flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-panel-charcoal border border-border-dark p-8 rounded-lg max-w-sm flex flex-col items-center gap-4.5 shadow-2xl">
          <div className="size-12 rounded-full bg-panel-hover border border-border-dark flex items-center justify-center">
            <Monitor className="size-6 text-text-muted" />
          </div>
          <div className="flex flex-col gap-1.5">
            <h3 className="text-sm font-bold text-text-white uppercase tracking-wider font-mono">Desktop Experience Required</h3>
            <p className="text-[10px] text-text-muted leading-relaxed">
              Anvaya Lab is optimized for professional desktop developers. Please open this workspace on a desktop or laptop computer to build and compose requests.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Page;