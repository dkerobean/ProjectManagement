'use client';

/**
 * GoldBottomNav - Shared Bottom Navigation Component
 * Consistent Lucide icons across all GoldTrader Pro pages
 */
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, ClipboardList, Landmark, Users, BarChart } from 'lucide-react';
import PageLoadingBar from './PageLoadingBar';
import { Suspense } from 'react';

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
    <>
      {/* Page Loading Bar */}
      <Suspense fallback={null}>
        <PageLoadingBar />
      </Suspense>
      
      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#1C1C1E]/95 backdrop-blur-md border-t border-gray-800 pb-safe-bottom">
        <div className="flex justify-around items-center px-2 py-2 max-w-lg mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex flex-col items-center p-2 rounded-xl group w-16 transition-all duration-300 relative
                  ${active ? '' : 'hover:bg-white/5'}`}
              >
                {active && (
                  <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/20 to-[#D4AF37]/5 rounded-xl opacity-100 transition-opacity"></div>
                )}
                <Icon 
                  className={`w-6 h-6 mb-1 transition-transform group-active:scale-90 ${
                    active ? 'text-[#D4AF37]' : 'text-gray-500 group-hover:text-gray-300'
                  }`} 
                  strokeWidth={active ? 2.5 : 2} 
                />
                <span className={`text-[10px] font-medium ${
                  active ? 'text-[#D4AF37]' : 'text-gray-500 group-hover:text-gray-300'
                }`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

