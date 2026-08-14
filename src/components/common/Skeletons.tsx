import React from 'react';

// Common shimmer animation utility class
const shimmer = 'st-skeleton';

export const SearchResultSkeleton: React.FC = () => {
  return (
    <div className="separator border-b px-1 py-6" aria-hidden="true">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          <div className={`h-5 w-2/3 max-w-64 ${shimmer}`} />
          <div className={`h-3 w-28 ${shimmer}`} />
        </div>
        <div className={`h-10 w-10 ${shimmer}`} />
      </div>
      <div className="separator mt-5 grid grid-cols-3 gap-3 border-y py-3">
        <div className={`h-8 ${shimmer}`} />
        <div className={`h-8 ${shimmer}`} />
        <div className={`h-8 ${shimmer}`} />
      </div>
      <div className="mt-4 flex items-center justify-between gap-4">
        <div className={`h-4 w-28 ${shimmer}`} />
        <div className={`h-4 w-44 max-w-[48%] ${shimmer}`} />
      </div>
    </div>
  );
};

export const BuildingDetailsSkeleton: React.FC = () => {
  return (
    <div className="building-dossier" aria-hidden="true">
      <div className="separator space-y-3 border-b py-8">
        <div className={`h-4 w-64 max-w-full ${shimmer}`} />
        <div className={`h-9 w-2/3 max-w-lg ${shimmer}`} />
        <div className={`h-4 w-40 ${shimmer}`} />
        <div className="flex gap-2 pt-3">
          <div className={`h-11 w-40 ${shimmer}`} />
          <div className={`h-11 w-24 ${shimmer}`} />
        </div>
      </div>
      <div className="separator grid grid-cols-2 border-b py-5 sm:grid-cols-4">
        <div className={`h-12 w-20 ${shimmer}`} />
        <div className={`h-12 w-20 ${shimmer}`} />
        <div className={`h-12 w-20 ${shimmer}`} />
        <div className={`h-12 w-24 ${shimmer}`} />
      </div>
      <div className="separator space-y-4 border-b py-10">
        <div className={`h-6 w-44 ${shimmer}`} />
        <div className={`h-4 w-full max-w-xl ${shimmer}`} />
        <div className={`h-4 w-4/5 max-w-lg ${shimmer}`} />
      </div>
    </div>
  );
};

export const ManagementProfileSkeleton: React.FC = () => {
  return (
    <div className="management-profile" aria-hidden="true">
      <div className="management-profile__hero">
        <div className="space-y-3">
          <div className={`h-4 w-52 ${shimmer}`} />
          <div className={`h-9 w-3/4 max-w-lg ${shimmer}`} />
          <div className={`h-4 w-full max-w-2xl ${shimmer}`} />
          <div className={`h-4 w-4/5 max-w-xl ${shimmer}`} />
          <div className="separator flex gap-6 border-y py-4">
            <div className={`h-10 w-32 ${shimmer}`} />
            <div className={`h-10 w-32 ${shimmer}`} />
          </div>
        </div>
        <div className="space-y-3">
          <div className={`h-6 w-44 ${shimmer}`} />
          <div className={`h-14 w-full ${shimmer}`} />
        </div>
      </div>
      <div className="management-profile__buildings space-y-2">
        <div className={`mb-4 h-6 w-56 ${shimmer}`} />
        <SearchResultSkeleton />
        <SearchResultSkeleton />
      </div>
    </div>
  );
};
