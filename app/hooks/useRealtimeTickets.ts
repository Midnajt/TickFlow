'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/app/lib/database.types';
import type { RealtimeChannel } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Singleton client dla real-time
let realtimeClient: ReturnType<typeof createClient<Database>> | null = null;

function getRealtimeClient() {
  if (!realtimeClient) {
    realtimeClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
  }
  return realtimeClient;
}

interface RealtimeEvent {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  ticketId: string;
  timestamp: number;
}

/**
 * Hook do nasłuchiwania real-time zmian w ticketach
 * Używa Supabase Realtime do automatycznego odświeżania
 */
export function useRealtimeTickets(onUpdate?: () => void) {
  const [lastEvent, setLastEvent] = useState<RealtimeEvent | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const client = getRealtimeClient();
    let channel: RealtimeChannel;

    // Subscribe do zmian w tabeli tickets
    channel = client
      .channel('tickets-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Nasłuchuj wszystkich zmian (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'tickets',
        },
        (payload) => {
          console.log('🔔 Real-time ticket change:', payload);

          const event: RealtimeEvent = {
            type: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
            ticketId: (payload.new as any)?.id || (payload.old as any)?.id,
            timestamp: Date.now(),
          };

          setLastEvent(event);

          // Wywołaj callback jeśli podany
          if (onUpdate) {
            onUpdate();
          }
        }
      )
      .subscribe((status) => {
        console.log('🔌 Realtime subscription status:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    // Cleanup
    return () => {
      console.log('🔌 Unsubscribing from realtime');
      channel.unsubscribe();
    };
  }, [onUpdate]);

  return {
    lastEvent,
    isConnected,
  };
}

