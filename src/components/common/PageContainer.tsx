import React from 'react';
import { ArrowLeft } from 'lucide-react';

export interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full' | '1200' | '1240';
  topPadding?: boolean;
  bottomPadding?: boolean;
  backAction?: {
    label: string;
    onBack: () => void;
  };
  headerRight?: React.ReactNode;
  id?: string;
}

export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  className = '',
  maxWidth = '1200',
  topPadding = true,
  bottomPadding = true,
  backAction,
  headerRight,
  id,
}) => {
  const maxWidthMap: Record<string, string> = {
    sm: 'max-w-3xl',
    md: 'max-w-4xl',
    lg: 'max-w-5xl',
    xl: 'max-w-7xl',
    '1200': 'max-w-[1200px]',
    '1240': 'max-w-[1240px]',
    full: 'max-w-full',
  };

  const containerWidth = maxWidthMap[maxWidth] || 'max-w-[1200px]';

  return (
    <div
      id={id}
      className={`w-full min-h-screen bg-[#F8F9FA] text-slate-800 flex flex-col ${
        bottomPadding ? 'pb-24 sm:pb-32' : ''
      } ${className}`}
    >
      {/* Top back navigation bar if provided */}
      {backAction && (
        <div className={`w-full mx-auto px-4 sm:px-6 md:px-8 ${containerWidth} ${topPadding ? 'pt-20 md:pt-24' : 'pt-4'}`}>
          <div className="flex items-center justify-between py-2">
            <button
              type="button"
              onClick={backAction.onBack}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-teal-800 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{backAction.label}</span>
            </button>
            {headerRight && <div>{headerRight}</div>}
          </div>
        </div>
      )}

      {/* Main Container Content */}
      <div
        className={`w-full mx-auto px-4 sm:px-6 md:px-8 flex-1 flex flex-col ${containerWidth} ${
          !backAction && topPadding ? 'pt-20 md:pt-24' : ''
        }`}
      >
        {children}
      </div>
    </div>
  );
};
