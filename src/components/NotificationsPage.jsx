import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useTheme } from '../hooks/useTheme';
import AppHeader from './AppHeader';
import Footer from './Footer';
import {
  subscribeToNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
} from '../services/notificationService';
import toast from 'react-hot-toast';

// --- Sub-components for better organization ---

const NotificationItem = ({ notification, onMarkRead, onDelete, onOpen, onAcceptConnection, onDeclineConnection }) => {
  const handleClick = () => {
    if (notification.unread) {
      onMarkRead(notification.id);
    }
    if (onOpen) onOpen(notification);
  };

  const isConnectionRequest = notification.type === 'connection_request';

  return (
    <li
      className="p-4 sm:p-6 flex items-start gap-4 hover:bg-background-light/50 dark:hover:bg-slate-800/50 transition-colors group"
    >
      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${notification.iconBg}`}>
        <span className={`material-symbols-outlined ${notification.iconColor}`}>
          {notification.icon}
        </span>
      </div>
      <div className="flex-grow min-w-0">
        <p className={`font-semibold text-secondary dark:text-white ${notification.unread ? 'font-bold' : ''}`}>
          {notification.title}
        </p>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 line-clamp-2">
          {notification.description}
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
          {notification.time}
        </p>
        {isConnectionRequest && (
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAcceptConnection?.(notification.id, notification.metadata?.userId);
              }}
              className="px-3 py-1.5 bg-primary text-white text-xs font-medium rounded-lg hover:bg-primary/80 transition-colors"
            >
              Accept
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeclineConnection?.(notification.id, notification.metadata?.userId);
              }}
              className="px-3 py-1.5 bg-slate-300 dark:bg-slate-700 text-secondary dark:text-white text-xs font-medium rounded-lg hover:bg-slate-400 dark:hover:bg-slate-600 transition-colors"
            >
              Decline
            </button>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        {notification.unread && (
          <div className="w-3 h-3 bg-primary rounded-full" title="Unread"></div>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(notification.id);
          }}
          className="text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
          title="Delete"
        >
          <span className="material-symbols-outlined text-lg">close</span>
        </button>
      </div>
    </li>
  );
};

// --- Main Page Component ---
const NotificationsPage = () => {
  const navigate = useNavigate();
  const { darkMode, toggleTheme } = useTheme();
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unsubscribe, setUnsubscribe] = useState(null);

  // Auth state & subscribe to notifications
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      if (!u) {
        navigate('/login');
        return;
      }
      setUser(u);
      setLoading(true);

      // Subscribe to real-time notifications
      const unsubNotifications = subscribeToNotifications(u.uid, (notifs) => {
        setNotifications(notifs);
        setLoading(false);
      });

      setUnsubscribe(() => unsubNotifications);
    });

    return () => {
      unsubAuth();
      if (unsubscribe) unsubscribe();
    };
  }, [navigate]);

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markAsRead(user.uid, notificationId);
      toast.success('Marked as read', { duration: 2000 });
    } catch (error) {
      console.error('Error marking as read:', error);
      toast.error('Failed to mark as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead(user.uid);
      toast.success('All marked as read', { duration: 2000 });
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Failed to mark all as read');
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    try {
      await deleteNotification(user.uid, notificationId);
      toast.success('Notification deleted', { duration: 2000 });
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Failed to delete notification');
    }
  };

  const handleDeleteAllNotifications = async () => {
    if (window.confirm('Are you sure you want to delete all notifications? This cannot be undone.')) {
      try {
        await deleteAllNotifications(user.uid);
        toast.success('All notifications deleted', { duration: 2000 });
      } catch (error) {
        console.error('Error deleting all notifications:', error);
        toast.error('Failed to delete all notifications');
      }
    }
  };

  const handleAcceptConnection = async (notificationId, userId) => {
    try {
      // Here you would add the connection to a 'connections' collection
      // For now, just delete the notification
      await deleteNotification(user.uid, notificationId);
      toast.success('Connection accepted!', { duration: 2000 });
    } catch (error) {
      console.error('Error accepting connection:', error);
      toast.error('Failed to accept connection');
    }
  };

  const handleDeclineConnection = async (notificationId, userId) => {
    try {
      // Delete the notification to decline the request
      await deleteNotification(user.uid, notificationId);
      toast.success('Connection declined', { duration: 2000 });
    } catch (error) {
      console.error('Error declining connection:', error);
      toast.error('Failed to decline connection');
    }
  };

  const unreadCount = notifications.filter((n) => n.unread).length;
  const hasUnread = unreadCount > 0;

  return (
    <div className="relative flex min-h-screen w-full flex-col">
      <AppHeader darkMode={darkMode} toggleDarkMode={toggleTheme} />
      <main className="flex-1 px-4 sm:px-10 py-8">
        <div className="flex flex-col max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <div>
              <h1 className="text-secondary dark:text-white text-xl sm:text-2xl lg:text-3xl font-bold leading-tight">
                Notifications
              </h1>
              {unreadCount > 0 && (
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  You have {unreadCount} unread notification{unreadCount > 1 ? 's' : ''}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 mt-4 sm:mt-0">
              {hasUnread && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors"
                  title="Mark all as read"
                >
                  Mark all as read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={handleDeleteAllNotifications}
                  className="px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                  title="Delete all"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-secondary rounded-xl shadow-md overflow-hidden">
            {loading ? (
              <div className="p-8 text-center">
                <div className="inline-block">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
                <p className="text-secondary dark:text-white text-lg font-medium mt-4">
                  Loading notifications...
                </p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <span className="material-symbols-outlined text-6xl text-slate-400 dark:text-slate-600">
                  notifications_none
                </span>
                <p className="text-secondary dark:text-white text-lg font-medium mt-4">
                  No notifications yet
                </p>
                <p className="text-slate-600 dark:text-slate-300 text-sm mt-2">
                  You'll see updates here when you receive messages, sell items, join referrals, and more.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-200 dark:divide-slate-700">
                {notifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkRead={handleMarkAsRead}
                    onDelete={handleDeleteNotification}
                    onAcceptConnection={handleAcceptConnection}
                    onDeclineConnection={handleDeclineConnection}
                    onOpen={(n) => {
                      // Navigate based on metadata (post, conversation, product, etc.)
                      const meta = n.metadata || {};
                      if (meta.postId) {
                        // go to campus feed and scroll to post
                        navigate(`/campusfeed#post-${meta.postId}`);
                        return;
                      }
                      if (meta.conversationId) {
                        // open inbox with convo selected
                        navigate(`/inbox?convo=${meta.conversationId}`);
                        return;
                      }
                      if (meta.productId) {
                        navigate(`/product-details/${meta.productId}`);
                        return;
                      }
                      if (meta.userId) {
                        navigate(`/profile/${meta.userId}`);
                        return;
                      }
                      // fallback: stay on notifications page
                    }}
                  />
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>
      <Footer darkMode={darkMode} />
    </div>
  );
};

export default NotificationsPage;


