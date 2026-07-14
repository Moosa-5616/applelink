import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ArrowRight, ShieldCheck, Sprout, Briefcase, Plus, Search } from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import TrustScore from '../components/ui/TrustScore';

export default function Home() {
  const { profile, role, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="page-container flex flex-col gap-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-600 to-primary-800 text-white p-6 shadow-elevated">
        <div className="absolute right-0 bottom-0 opacity-10 translate-y-1/4 translate-x-1/4 select-none">
          <span className="text-9xl">🍎</span>
        </div>
        
        <div className="relative z-10 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Badge variant="primary" className="bg-white/20 text-white text-[10px] uppercase font-bold py-0.5 px-2">
              Verified Member
            </Badge>
            {profile?.is_verified && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold bg-primary-100 text-primary-800 px-2 py-0.5 rounded-full">
                <ShieldCheck className="w-3.5 h-3.5 fill-current" /> Verified
              </span>
            )}
          </div>
          <h2 className="text-xl font-bold mt-1">Hello, {profile?.full_name || 'Agri Partner'}</h2>
          <p className="text-xs text-white/80 max-w-sm">
            {role === 'farmer' 
              ? `Manage your apple orchards, view active bids, and sell directly to verified corporate buyers.`
              : 'Browse premium apples direct from validation checkpoints and submit pricing offers directly to farmers.'}
          </p>
        </div>
      </div>

      {/* Profile Overview Stats */}
      {role === 'farmer' && (
        <div className="grid grid-cols-2 gap-4">
          <Card className="flex flex-col items-center justify-center text-center gap-1" padding="md">
            <span className="text-2xl font-bold text-primary-600">{profile?.total_sales || 0}</span>
            <span className="text-xs font-semibold text-text-secondary">Completed Deals</span>
          </Card>
          <Card className="flex flex-col items-center justify-center text-center gap-1" padding="md">
            <span className="text-2xl font-bold text-primary-600">{profile?.avg_rating || 0.0} ★</span>
            <span className="text-xs font-semibold text-text-secondary">Orchard Rating</span>
          </Card>
        </div>
      )}

      {/* Main Action Hub */}
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted mt-2">Recommended Actions</h3>

        {role === 'farmer' ? (
          <>
            <Card hoverable className="flex items-center justify-between p-4" onClick={() => navigate('/create-listing')}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600">
                  <Plus className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-text-primary">Create New Listing</h4>
                  <p className="text-xs text-text-secondary mt-0.5">Post pricing, variety, grade & load details</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-text-muted" />
            </Card>

            <Card hoverable className="flex items-center justify-between p-4" onClick={() => navigate('/dashboard')}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600">
                  <Sprout className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-text-primary">Farmer Dashboard</h4>
                  <p className="text-xs text-text-secondary mt-0.5">Monitor active listings & incoming offers</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-text-muted" />
            </Card>
          </>
        ) : (
          <>
            <Card hoverable className="flex items-center justify-between p-4" onClick={() => navigate('/marketplace')}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600">
                  <Search className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-text-primary">Browse Marketplace</h4>
                  <p className="text-xs text-text-secondary mt-0.5">Filter by district, grade, and variety</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-text-muted" />
            </Card>

            <Card hoverable className="flex items-center justify-between p-4" onClick={() => navigate('/dashboard')}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600">
                  <Briefcase className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-text-primary">Buyer Dashboard</h4>
                  <p className="text-xs text-text-secondary mt-0.5">Track submitted orders & saved orchards</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-text-muted" />
            </Card>
          </>
        )}
      </div>

      {/* Logged In As Info Box */}
      <Card className="flex items-center justify-between p-4 border border-border bg-background-alt/50 mt-4">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-text-secondary font-medium">Logged in via Phone Link</span>
          <span className="text-sm font-bold text-text-primary">{profile?.phone}</span>
        </div>
        <Button variant="ghost" size="sm" className="text-xs font-bold text-error hover:bg-error-light" onClick={logout}>
          Log Out
        </Button>
      </Card>
    </div>
  );
}
