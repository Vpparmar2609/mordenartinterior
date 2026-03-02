import React, { Suspense } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Sidebar } from './Sidebar';
import { PageTransition } from './PageTransition';

export const DashboardLayout: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const location = useLocation();

  return (
    <div className="min-h-screen min-h-[100dvh] bg-background overflow-x-hidden">
      <Sidebar />
      <main id="main-content" role="main" className="md:ml-64 min-h-screen min-h-[100dvh] gpu-accelerated">
        <div className="p-3 sm:p-4 md:p-8 pt-16 md:pt-8 max-w-full">
          <AnimatePresence mode="wait">
            <PageTransition key={location.pathname}>
              <Suspense fallback={
                <div className="flex items-center justify-center min-h-[50vh] gap-3">
                  <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin will-change-transform" />
                  <span className="text-sm text-muted-foreground animate-pulse">Loading…</span>
                </div>
              }>
                <Outlet />
              </Suspense>
            </PageTransition>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};
