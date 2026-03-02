import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

const StatCardSkeleton = () => (
  <div className="glass-card rounded-2xl p-6">
    <div className="flex items-start justify-between">
      <div className="space-y-3 flex-1">
        <Skeleton className="h-4 w-24 skeleton-shimmer" />
        <Skeleton className="h-8 w-16 skeleton-shimmer" />
      </div>
      <Skeleton className="h-11 w-11 rounded-xl skeleton-shimmer" />
    </div>
  </div>
);

const ListSkeleton = () => (
  <div className="space-y-3">
    {[1, 2, 3, 4].map(i => (
      <div key={i} className="flex items-center gap-3">
        <Skeleton className="h-9 w-9 rounded-lg skeleton-shimmer" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-4 w-3/4 skeleton-shimmer" />
          <Skeleton className="h-3 w-1/2 skeleton-shimmer" />
        </div>
      </div>
    ))}
  </div>
);

export const DashboardSkeleton: React.FC = () => (
  <div className="space-y-6 animate-fade-in">
    {/* Stats grid skeleton */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3, 4, 5, 6].map(i => (
        <StatCardSkeleton key={i} />
      ))}
    </div>

    {/* Cards skeleton */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="glass-card">
        <CardHeader>
          <Skeleton className="h-5 w-36 skeleton-shimmer" />
        </CardHeader>
        <CardContent>
          <ListSkeleton />
        </CardContent>
      </Card>
      <Card className="glass-card">
        <CardHeader>
          <Skeleton className="h-5 w-32 skeleton-shimmer" />
        </CardHeader>
        <CardContent>
          <ListSkeleton />
        </CardContent>
      </Card>
    </div>
  </div>
);
