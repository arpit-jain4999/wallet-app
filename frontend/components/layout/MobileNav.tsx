'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Wallet, History } from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  {
    name: 'Wallet',
    href: '/',
    icon: Wallet,
  },
  {
    name: 'Transactions',
    href: '/transactions',
    icon: History,
  },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-background z-50">
      <div className="flex">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex-1 flex flex-col items-center justify-center gap-1 py-3 px-2 text-xs font-medium transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-accent-foreground',
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

