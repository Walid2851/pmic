'use client';

import dynamic from 'next/dynamic';

const FeeTypeManagementPage = dynamic(() => import('./fee-management'), { 
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center min-h-[400px]">
      <p className="text-lg">Loading fee management...</p>
    </div>
  ),
});

export default function FeesPage() {
  return <FeeTypeManagementPage />;
}