import Link from 'next/link';
import { ReactNode } from 'react';
import { ArrowRightIcon } from '@heroicons/react/24/outline';

interface AdminDashboardCardProps {
  title: string;
  value: number;
  icon: ReactNode;
  href: string;
  linkText: string;
}

export default function AdminDashboardCard({
  title,
  value,
  icon,
  href,
  linkText
}: AdminDashboardCardProps) {
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0 bg-[#E7F5F3] p-3 rounded-md">
            {icon}
          </div>
          <div className="ml-5 w-0 flex-1">
            <dt className="text-sm font-medium text-gray-500 truncate">
              {title}
            </dt>
            <dd className="flex items-baseline">
              <div className="text-2xl font-semibold text-gray-900">
                {value.toLocaleString()}
              </div>
            </dd>
          </div>
        </div>
      </div>
      <div className="bg-gray-50 px-4 py-4 sm:px-6">
        <div className="text-sm">
          <Link
            href={href}
            className="font-medium text-[#128C7E] hover:text-[#0e6b5e] flex items-center"
          >
            {linkText}
            <ArrowRightIcon className="ml-1 h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
} 