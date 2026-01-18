'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Wallet, History } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Typography } from '@/components/ui/typography';
import { TypographyVariant } from '@/lib/enums';

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

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="hidden md:flex h-screen w-64 flex-col border-r bg-background">
      <div className="flex h-16 items-center border-b px-6">
        <Typography variant={TypographyVariant.H2}>Wallet App</Typography>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

