'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: '📊' },
  { name: 'Game Rooms', href: '/dashboard/rooms', icon: '🎮' },
  { name: 'Questions', href: '/dashboard/questions', icon: '❓' },
  { name: 'Participants', href: '/dashboard/participants', icon: '👥' },
  { name: 'Rewards', href: '/dashboard/rewards', icon: '🎁' },
  { name: 'Access Codes', href: '/dashboard/access-codes', icon: '🔑' },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white shadow-sm rounded-lg mr-6 p-4">
      <nav className="space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || 
                           (pathname?.startsWith(item.href + '/') && item.href !== '/dashboard');
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                group flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-150
                ${isActive 
                  ? 'bg-[#128C7E] text-white' 
                  : 'text-gray-700 hover:bg-[#f0f2f5] hover:text-[#128C7E]'}
              `}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className="mr-3 text-lg">{item.icon}</span>
              {item.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
} 