import React from 'react';

// Common shimmer animation utility class
const shimmer = 'animate-pulse bg-slate-200/70 rounded-lg';

export const SearchResultSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2 flex-1">
          <div className={`h-3 w-32 ${shimmer}`} />
          <div className={`h-5 w-3/4 ${shimmer}`} />
          <div className={`h-3 w-1/2 ${shimmer}`} />
        </div>
        <div className={`w-10 h-10 rounded-xl ${shimmer}`} />
      </div>

      {/* Badges */}
      <div className="flex items-center gap-2">
        <div className={`h-6 w-28 rounded-full ${shimmer}`} />
        <div className={`h-6 w-20 rounded-full ${shimmer}`} />
      </div>

      {/* Specs Grid */}
      <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
        <div className={`h-8 ${shimmer}`} />
        <div className={`h-8 ${shimmer}`} />
        <div className={`h-8 ${shimmer}`} />
      </div>

      {/* Health & Violations Row */}
      <div className={`h-10 w-full rounded-xl ${shimmer}`} />

      {/* Footer */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
        <div className={`h-4 w-36 ${shimmer}`} />
        <div className={`h-8 w-16 rounded-xl ${shimmer}`} />
      </div>
    </div>
  );
};

export const BuildingHealthSkeleton: React.FC = () => {
  return (
    <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50 flex items-center gap-3">
      <div className={`w-9 h-9 rounded-xl ${shimmer} shrink-0`} />
      <div className="space-y-1.5 flex-1">
        <div className={`h-4 w-28 ${shimmer}`} />
        <div className={`h-3 w-48 ${shimmer}`} />
      </div>
    </div>
  );
};

export const BuildingDetailsSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="space-y-3">
        <div className={`h-6 w-48 rounded-full ${shimmer}`} />
        <div className={`h-9 w-2/3 ${shimmer}`} />
        <div className={`h-4 w-80 ${shimmer}`} />
      </div>

      {/* Main Specs Bento Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 p-6 bg-white rounded-2xl border border-slate-200/80 space-y-4">
          <div className={`h-4 w-40 ${shimmer}`} />
          <div className="grid grid-cols-4 gap-3">
            <div className={`h-16 ${shimmer}`} />
            <div className={`h-16 ${shimmer}`} />
            <div className={`h-16 ${shimmer}`} />
            <div className={`h-16 ${shimmer}`} />
          </div>
        </div>
        <div className={`h-48 rounded-2xl ${shimmer}`} />
      </div>

      {/* Overview Card Skeleton */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-4">
        <div className={`h-6 w-40 ${shimmer}`} />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className={`h-14 ${shimmer}`} />
          <div className={`h-14 ${shimmer}`} />
          <div className={`h-14 ${shimmer}`} />
          <div className={`h-14 ${shimmer}`} />
        </div>
      </div>
    </div>
  );
};

export const ManagementProfileSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-4">
        <div className={`h-6 w-56 rounded-full ${shimmer}`} />
        <div className={`h-8 w-1/2 ${shimmer}`} />
        <div className={`h-4 w-64 ${shimmer}`} />
        <div className="flex gap-2">
          <div className={`h-8 w-28 rounded-lg ${shimmer}`} />
          <div className={`h-8 w-36 rounded-lg ${shimmer}`} />
        </div>
      </div>

      {/* Borough Breakdown Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className={`h-24 ${shimmer}`} />
        <div className={`h-24 ${shimmer}`} />
        <div className={`h-24 ${shimmer}`} />
        <div className={`h-24 ${shimmer}`} />
      </div>

      {/* Managed Buildings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SearchResultSkeleton />
        <SearchResultSkeleton />
      </div>
    </div>
  );
};

export const ExploreMapSkeleton: React.FC = () => {
  return (
    <div className="w-full h-full min-h-[460px] bg-slate-100 rounded-2xl border border-slate-200/80 p-4 relative overflow-hidden flex flex-col justify-between">
      <div className="flex justify-between items-center z-10">
        <div className={`h-8 w-36 rounded-full ${shimmer}`} />
        <div className={`h-8 w-24 rounded-xl ${shimmer}`} />
      </div>

      {/* Pin placeholders */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative w-full h-full">
          <div className={`absolute top-1/4 left-1/3 h-7 w-20 rounded-full ${shimmer}`} />
          <div className={`absolute top-1/2 left-1/2 h-7 w-24 rounded-full ${shimmer}`} />
          <div className={`absolute top-2/3 left-1/4 h-7 w-22 rounded-full ${shimmer}`} />
          <div className={`absolute top-1/3 left-2/3 h-7 w-18 rounded-full ${shimmer}`} />
        </div>
      </div>

      <div className={`h-12 w-full max-w-sm rounded-2xl ${shimmer} z-10`} />
    </div>
  );
};
