'use client';

import { Loading } from './loading';

export function AppLoader({ message }: { message?: string }) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background backdrop-blur-sm">
      <Loading size="lg" message={message} />
    </div>
  );
}
