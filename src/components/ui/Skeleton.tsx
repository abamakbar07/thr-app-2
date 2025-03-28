import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'default' | 'card' | 'avatar' | 'button' | 'text';
}

export function Skeleton({ className, variant = 'default' }: SkeletonProps) {
  return (
    <div 
      className={cn(
        "animate-pulse bg-gray-200 rounded-md",
        variant === 'card' && "h-32 w-full",
        variant === 'avatar' && "h-12 w-12 rounded-full",
        variant === 'button' && "h-10 w-24",
        variant === 'text' && "h-4 w-3/4",
        className
      )}
    />
  );
}

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("p-4 border rounded-lg shadow-sm", className)}>
      <Skeleton variant="text" className="mb-4 h-6 w-1/3" />
      <Skeleton variant="text" className="mb-2" />
      <Skeleton variant="text" className="mb-2 w-4/5" />
      <Skeleton variant="text" className="mb-4 w-2/3" />
      <Skeleton variant="button" className="mt-2" />
    </div>
  );
}

export function QuestionCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("p-5 border rounded-lg shadow-sm bg-white", className)}>
      <Skeleton variant="text" className="mb-4 h-6 w-3/4" />
      <div className="space-y-3">
        <Skeleton variant="text" className="w-full" />
        <Skeleton variant="text" className="w-full" />
        <Skeleton variant="text" className="w-full" />
        <Skeleton variant="text" className="w-full" />
      </div>
    </div>
  );
}

export function LeaderboardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("p-6 bg-white rounded-lg shadow-md", className)}>
      <Skeleton variant="text" className="mb-6 h-7 w-1/3 mx-auto" />
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center space-x-3">
            <Skeleton variant="text" className="w-6 h-6" />
            <Skeleton variant="avatar" />
            <Skeleton variant="text" className="flex-grow" />
            <Skeleton variant="text" className="w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function QuestionsListSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", className)}>
      {Array.from({ length: 6 }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
} 