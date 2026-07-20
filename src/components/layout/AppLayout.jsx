import { Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Header from './Header';
import MobileNav from './MobileNav';
import GlobalReviewCheck from '../GlobalReviewCheck';

export default function AppLayout() {
  const { user, role } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <GlobalReviewCheck />
      <Header user={user} />
      <main className="pb-16 sm:pb-0">
        <Outlet />
      </main>
      <MobileNav role={role} />
    </div>
  );
}

