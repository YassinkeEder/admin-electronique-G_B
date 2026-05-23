import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Notification } from '../types';

export interface ExtendedNotification extends Notification {
  user?: { full_name: string; email: string };
}

export function useNotifications(userId?: string) {
  const [notifications, setNotifications] = useState<ExtendedNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      const notifs = (data as ExtendedNotification[]) || [];
      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.is_read).length);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setIsConnected(false);
      return;
    }

    let isMounted = true;

    // Fetch initial notifications
    fetchNotifications();

    // Setup Realtime subscription
    const channel = supabase
      .channel(`notifications-${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      }, (payload) => {
        if (isMounted) {
          const newNotification = payload.new as ExtendedNotification;
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      }, (payload) => {
        if (isMounted) {
          const updated = payload.new as ExtendedNotification;
          setNotifications(prev =>
            prev.map(n => n.id === updated.id ? updated : n)
          );
          // Recalculate unread count
          setNotifications(prev => {
            setUnreadCount(prev.filter(n => !n.is_read).length);
            return prev;
          });
        }
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      }, (payload) => {
        if (isMounted) {
          const deletedId = (payload.old as ExtendedNotification).id;
          setNotifications(prev => {
            const filtered = prev.filter(n => n.id !== deletedId);
            setUnreadCount(filtered.filter(n => !n.is_read).length);
            return filtered;
          });
        }
      })
      .subscribe((status) => {
        if (isMounted) {
          setIsConnected(status === 'SUBSCRIBED');
        }
      });

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
      setIsConnected(false);
    };
  }, [userId, fetchNotifications]);

  const markAsRead = useCallback(async (notificationId: string) => {
    await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', notificationId);
    // The Realtime UPDATE event will update the local state
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!userId) return;
    await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('is_read', false);
    // The Realtime UPDATE events will update the local state
  }, [userId]);

  const deleteNotification = useCallback(async (notificationId: string) => {
    await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);
    // The Realtime DELETE event will update the local state
  }, []);

  return {
    notifications,
    unreadCount,
    loading,
    isConnected,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refetch: fetchNotifications,
  };
}
