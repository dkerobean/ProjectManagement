'use client';

/**
 * GoldBottomNav - Shared Bottom Navigation Component
 * Consistent Lucide icons across all GoldTrader Pro pages
 */
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, ClipboardList, Landmark, Users, BarChart } from 'lucide-react';

const navItems = [
  { label: 'Home', icon: Home, href: '/gold' },
  { label: 'Trade', icon: ClipboardList, href: '/gold/trade' },
  { label: 'Vault', icon: Landmark, href: '/gold/vault' },
  { label: 'People', icon: Users, href: '/gold/suppliers' },
  { label: 'Reports', icon: BarChart, href: '/gold/reports' },
];

export default function GoldBottomNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/gold') {
      return pathname === '/gold';
    }
    return pathname?.startsWith(href) || false;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 pt-2 safe-area-bottom">
      <div className="bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/50 mx-auto max-w-lg">
        <div className="flex justify-around items-center p-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-300 w-16
                  ${active 
                    ? 'text-amber-400 bg-white/5 shadow-[0_0_10px_rgba(251,191,36,0.15)] -translate-y-1' 
                    : 'text-gray-500 hover:text-gray-300 hover:bg-white/5 active:scale-95'
                  }`}
              >
                <Icon className="w-6 h-6" strokeWidth={active ? 2.5 : 2} />
                <span className={`text-[10px] font-medium ${active ? 'font-bold' : ''}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
