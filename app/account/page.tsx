'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { getCustomerProfile, updateCustomerProfile } from '@/lib/supabase/profile';
import { useWishlist } from '@/components/providers/wishlist-provider';
import type { UserProfile } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  User,
  Mail,
  Phone,
  Calendar,
  Shield,
  Heart,
  LogOut,
  Edit,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  KeyRound,
  ShoppingBag,
} from 'lucide-react';

export default function AccountPage() {
  const router = useRouter();
  const { wishlistCount } = useWishlist();

  const [loading, setLoading] = React.useState(true);
  const [profile, setProfile] = React.useState<UserProfile | null>(null);
  const [email, setEmail] = React.useState('');
  
  // Edit Profile Form state
  const [isEditing, setIsEditing] = React.useState(false);
  const [fullName, setFullName] = React.useState('');
  const [phoneNum, setPhoneNum] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState<{ type: 'success' | 'error'; text: string } | null>(null);

  React.useEffect(() => {
    async function loadAccountData() {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          router.push('/login?redirectTo=/account');
          return;
        }

        setEmail(user.email || '');

        const prof = await getCustomerProfile();
        if (prof) {
          setProfile(prof);
          setFullName(prof.fullName || user.user_metadata?.full_name || '');
          setPhoneNum(prof.phone || user.user_metadata?.phone || '');
        } else {
          setFullName(user.user_metadata?.full_name || '');
          setPhoneNum(user.user_metadata?.phone || '');
        }
      } catch {
        // Auth safety error
      } finally {
        setLoading(false);
      }
    }

    loadAccountData();
  }, [router]);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setSaving(true);

    try {
      const res = await updateCustomerProfile({
        fullName,
        phone: phoneNum,
      });

      if (res.success && res.profile) {
        setProfile(res.profile);
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        setIsEditing(false);
      } else {
        setMessage({ type: 'error', text: res.message || 'Failed to update profile.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'An unexpected error occurred.' });
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-32 pb-20 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-gold-deep" />
          <p className="text-sm text-muted-foreground">Loading account profile...</p>
        </div>
      </div>
    );
  }

  const initials = fullName
    ? fullName.split(' ').map((n) => n[0]).join('').toUpperCase().substring(0, 2)
    : email.substring(0, 2).toUpperCase();

  const formattedDate = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      })
    : 'Member';

  return (
    <div className="min-h-screen pt-28 pb-20 px-5 lg:px-10 max-w-7xl mx-auto space-y-8">
      {/* Account Banner & Header */}
      <div className="relative overflow-hidden rounded-3xl border border-border bg-ink p-8 sm:p-10 text-white shadow-2xl">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gold/15 blur-[100px]" />
        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-2 border-gold/40 bg-white/10 text-2xl font-bold text-gold backdrop-blur-md">
              {initials}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-display text-2xl sm:text-3xl font-medium tracking-tight">
                  {fullName || 'Valued Customer'}
                </h1>
                {profile?.role === 'admin' ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-gold/20 px-3 py-0.5 text-xs font-bold text-gold-deep border border-gold/30">
                    <Shield className="h-3 w-3" />
                    Admin
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-0.5 text-xs font-medium text-white/90">
                    Customer Account
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-white/80 flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-gold" />
                {email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="rounded-full border-white/20 text-white hover:bg-white/10"
            >
              <Link href="/wishlist">
                <Heart className="mr-2 h-4 w-4 text-destructive" />
                Wishlist ({wishlistCount})
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="rounded-full text-destructive hover:bg-destructive/10"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {message && (
        <div
          className={`flex items-center gap-3 rounded-2xl border p-4 text-sm ${
            message.type === 'success'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
              : 'border-destructive/30 bg-destructive/10 text-destructive'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Information & Edit Form */}
        <div className="lg:col-span-2 rounded-3xl border border-border bg-card/60 p-6 sm:p-8 backdrop-blur-xl space-y-6">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <User className="h-5 w-5 text-gold-deep" />
                Profile Information
              </h2>
              <p className="text-xs text-muted-foreground">Manage your personal account details</p>
            </div>
            {!isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="rounded-full text-xs font-semibold"
              >
                <Edit className="mr-1.5 h-3.5 w-3.5" />
                Edit Profile
              </Button>
            )}
          </div>

          {isEditing ? (
            <form onSubmit={handleProfileSave} className="space-y-4">
              <div>
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="mt-1 rounded-xl"
                  disabled={saving}
                />
              </div>

              <div>
                <Label htmlFor="email">Email Address (Read-only)</Label>
                <Input
                  id="email"
                  type="email"
                  disabled
                  value={email}
                  className="mt-1 rounded-xl bg-muted/50 cursor-not-allowed"
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phoneNum}
                  onChange={(e) => setPhoneNum(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="mt-1 rounded-xl"
                  disabled={saving}
                />
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-border">
                <Button
                  type="submit"
                  disabled={saving}
                  className="gold-button rounded-full font-semibold px-6"
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsEditing(false)}
                  disabled={saving}
                  className="rounded-full text-muted-foreground"
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="rounded-2xl border border-border/60 bg-background/40 p-4 space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Full Name</p>
                <p className="text-sm font-semibold">{fullName || 'Not specified'}</p>
              </div>

              <div className="rounded-2xl border border-border/60 bg-background/40 p-4 space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email Address</p>
                <p className="text-sm font-semibold truncate">{email}</p>
              </div>

              <div className="rounded-2xl border border-border/60 bg-background/40 p-4 space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Phone Number</p>
                <p className="text-sm font-semibold">{phoneNum || 'Not specified'}</p>
              </div>

              <div className="rounded-2xl border border-border/60 bg-background/40 p-4 space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Member Since</p>
                <p className="text-sm font-semibold flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-gold-deep" />
                  {formattedDate}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Quick Links & Wishlist Summary */}
        <div className="space-y-6">
          {/* Wishlist Shortcut Card */}
          <div className="rounded-3xl border border-border bg-card/60 p-6 backdrop-blur-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold flex items-center gap-2">
                <Heart className="h-4 w-4 text-destructive" />
                Saved Wishlist
              </h3>
              <span className="rounded-full bg-gold/20 text-gold-deep px-2.5 py-0.5 text-xs font-bold">
                {wishlistCount} {wishlistCount === 1 ? 'Item' : 'Items'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Your saved pieces from our Home Decor collection are stored securely in your account.
            </p>
            <Button
              asChild
              className="w-full rounded-full gold-button font-semibold"
            >
              <Link href="/wishlist">
                View My Wishlist
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          {/* Account Security & Actions */}
          <div className="rounded-3xl border border-border bg-card/60 p-6 backdrop-blur-xl space-y-4">
            <h3 className="text-base font-semibold flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-gold-deep" />
              Security & Options
            </h3>
            <div className="space-y-2">
              <Button
                asChild
                variant="outline"
                className="w-full justify-start rounded-xl text-xs"
              >
                <Link href="/forgot-password">
                  <KeyRound className="mr-2 h-4 w-4 text-gold-deep" />
                  Reset Password
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="w-full justify-start rounded-xl text-xs"
              >
                <Link href="/home-decor">
                  <ShoppingBag className="mr-2 h-4 w-4 text-gold-deep" />
                  Browse Home Decor Catalog
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
