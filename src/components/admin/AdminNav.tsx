'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

const navItems = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Game Rooms', href: '/dashboard/rooms' },
  { name: 'Questions', href: '/dashboard/questions' },
  { name: 'Participants', href: '/dashboard/participants' },
  { name: 'Rewards', href: '/dashboard/rewards' },
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
                group flex items-center px-3 py-2 text-sm font-medium rounded-md
                ${isActive 
                  ? 'bg-indigo-100 text-indigo-700' 
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'}
              `}
              aria-current={isActive ? 'page' : undefined}
            >
              {item.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
} 