'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: '📊' },
  { name: 'Game Rooms', href: '/dashboard/rooms', icon: '🎮' },
  { name: 'Questions', href: '/dashboard/questions', icon: '❓' },
  { name: 'Browse Questions', href: '/dashboard/questions/browse', icon: '🔍' },
  { name: 'Participants', href: '/dashboard/participants', icon: '👥' },
  { name: 'Rewards', href: '/dashboard/rewards', icon: '🎁' },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white shadow-md rounded-lg mr-6 p-5 border border-gray-200">
      <h2 className="text-lg font-semibold text-gray-800 mb-4 px-2">Admin Menu</h2>
      <nav className="space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || 
                           (pathname?.startsWith(item.href + '/') && item.href !== '/dashboard');
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                group flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200
                ${isActive 
                  ? 'bg-green-600 text-white shadow-sm' 
                  : 'text-gray-700 hover:bg-green-50 hover:text-green-700 hover:shadow-sm'}
              `}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className="mr-3 text-xl flex items-center justify-center w-7">{item.icon}</span>
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
      
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="px-4 py-2">
          <h3 className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Help & Resources</h3>
          <div className="mt-3 space-y-2">
            <a href="#" className="flex items-center text-sm text-gray-600 hover:text-green-600 px-2 py-1 rounded">
              <span className="mr-2">📖</span>
              <span>Documentation</span>
            </a>
            <a href="#" className="flex items-center text-sm text-gray-600 hover:text-green-600 px-2 py-1 rounded">
              <span className="mr-2">🛟</span>
              <span>Support</span>
            </a>
          </div>
        </div>
      </div>
    </aside>
  );
} 