import { useCallback, useEffect, useState } from 'react';
import { getPaymentChannels, loadConfig, type PaymentChannel, type TripayConfig } from '../services/tripay';
import { FALLBACK_CHANNELS } from '../data/fallbackChannels';

export interface ChannelsState {
  channels: PaymentChannel[];
  /** true bila daftar berasal dari data fallback, bukan API live. */
  fallback: boolean;
  loading: boolean;
  error: string | null;
  config: TripayConfig;
  reload: () => void;
  setConfig: (next: TripayConfig) => void;
}

/**
 * =============================================================
 *  useTripayChannels — ambil daftar channel pembayaran Tripay
 * -------------------------------------------------------------
 *  Memanggil GET /merchant/payment-channel lewat service Tripay.
 *  Bila permintaan gagal (umumnya karena CORS atau API Key
 *  salah), dipakai FALLBACK_CHANNELS agar halaman tetap bisa
 *  menampilkan daftar channel.
 * ============================================================= */
export function useTripayChannels(): ChannelsState {
  const [config, setConfigState] = useState<TripayConfig>(() => loadConfig());
  const [channels, setChannels] = useState<PaymentChannel[]>([]);
  const [fallback, setFallback] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  const reload = useCallback(() => setNonce((value) => value + 1), []);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);

    getPaymentChannels(config)
      .then((list) => {
        if (!alive) return;
        const active = list.filter((channel) => channel.active !== false);
        // Bila API sukses tapi kosong, tetap pakai fallback supaya tidak blank.
        if (active.length > 0) {
          setChannels(active);
          setFallback(false);
        } else {
          setChannels(FALLBACK_CHANNELS.filter((channel) => channel.active));
          setFallback(true);
          setError('Tripay tidak mengembalikan channel aktif apa pun. Menampilkan daftar bawaan.');
        }
      })
      .catch((err: unknown) => {
        if (!alive) return;
        setChannels(FALLBACK_CHANNELS.filter((channel) => channel.active));
        setFallback(true);
        setError(err instanceof Error ? err.message : 'Gagal memuat channel pembayaran.');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [config, nonce]);

  const setConfig = useCallback((next: TripayConfig) => {
    setConfigState(next);
    setNonce((value) => value + 1);
  }, []);

  return { channels, fallback, loading, error, config, reload, setConfig };
}
