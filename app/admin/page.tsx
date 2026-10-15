import type { Metadata } from 'next';
import * as React from 'react';
import { redirect } from 'next/navigation';
import { verifyAdminAccess } from '@/lib/supabase/admin';
import { ShieldCheck, Database, Layers, CheckCircle2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { AdminWorkspace } from '@/components/admin/admin-workspace';

export const metadata: Metadata = {
  title: 'Admin Management Workspace',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminDashboardPage() {

  const { isAdmin, userId, email } = await verifyAdminAccess();

  if (!isAdmin) {
    redirect('/login?redirectTo=/admin');
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <Link
            href="/"
            className="inline-flex items-center text-xs font-medium text-muted-foreground hover:text-foreground mb-3 transition-colors"
          >
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
            Back to site
          </Link>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/10 border border-gold/30 text-gold-deep">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <h1 className="font-display text-2xl font-medium tracking-tight sm:text-3xl">
                Admin <span className="gold-text">Catalog Management</span>
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Protected Management Workspace • Authenticated as <span className="font-medium text-foreground">{email}</span>
              </p>
            </div>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-medium text-emerald-400">
          <CheckCircle2 className="h-4 w-4" />
          <span>Server Verified Admin</span>
        </div>
      </div>

      <AdminWorkspace />
    </div>
  );
}
