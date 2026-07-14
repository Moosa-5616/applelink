import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, ShoppingBag, Star } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getNotifications, markNotificationsRead } from '../lib/database';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!profile?.id) return;
      setLoading(true);
      try {
        const { data, error } = await getNotifications(profile.id);
        if (error) {
          console.error('Error fetching notifications:', error);
        } else {
          setNotifications(data || []);
        }
      } catch (err) {
        console.error('Error fetching notifications:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [profile?.id]);

  const markAllRead = async () => {
    if (!profile?.id) return;
    try {
      await markNotificationsRead(profile.id);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('Error marking notifications as read:', err);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'offer_received':
        return <ShoppingBag className="w-5 h-5 text-primary-600" />;
      case 'review_added':
        return <Star className="w-5 h-5 text-amber-500 fill-amber-500" />;
      default:
        return <Bell className="w-5 h-5 text-text-secondary" />;
    }
  };

  return (
    <div className="page-container flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl bg-surface border border-border text-text-secondary hover:bg-background-alt cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-semibold text-text-secondary">Notifications</span>
        </div>
        <button
          onClick={markAllRead}
          className="text-xs font-bold text-primary-600 hover:text-primary-750 cursor-pointer"
        >
          Mark all as read
        </button>
      </div>

      {/* Notifications Queue */}
      <div className="flex flex-col gap-3">
        {loading ? (
          <div className="text-center py-12">
            <div className="w-10 h-10 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-xs text-text-secondary">Loading notifications...</p>
          </div>
        ) : notifications.length > 0 ? (
          notifications.map((n) => (
            <Card
              key={n.id}
              className={`flex items-start gap-4 relative overflow-hidden transition-all ${
                n.is_read ? 'opacity-75 bg-surface' : 'bg-primary-50/20 border-primary-100 ring-1 ring-primary-500/5'
              }`}
              padding="md"
            >
              {/* Unread Indicator Bar */}
              {!n.is_read && (
                <div className="absolute top-0 bottom-0 left-0 w-1 bg-primary-600" />
              )}

              <div className="w-10 h-10 rounded-xl bg-background-alt flex items-center justify-center shrink-0">
                {getIcon(n.type)}
              </div>

              <div className="flex-1 flex flex-col gap-0.5">
                <div className="flex justify-between items-start gap-2">
                  <h4 className={`text-xs font-bold text-text-primary ${!n.is_read ? 'font-extrabold' : ''}`}>
                    {n.title}
                  </h4>
                  <span className="text-[9px] text-text-muted font-medium shrink-0">
                    {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed mt-0.5">
                  {n.message}
                </p>
              </div>
            </Card>
          ))
        ) : (
          <div className="text-center py-12 bg-surface border border-dashed rounded-2xl">
            <span className="text-4xl block mb-2 select-none">🔔</span>
            <h4 className="font-bold text-text-primary text-sm">Clear Queue</h4>
            <p className="text-xs text-text-secondary mt-1">We'll alert you as soon as buyers start bidding on your listings.</p>
          </div>
        )}
      </div>
    </div>
  );
}
