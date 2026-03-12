import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

export function getMetricColor(
  value: number,
  thresholds: { green: number; yellow: number },
  direction: 'higher' | 'lower' = 'higher'
): string {
  if (direction === 'higher') {
    if (value >= thresholds.green) return 'text-emerald-400';
    if (value >= thresholds.yellow) return 'text-amber-400';
    return 'text-red-400';
  }
  if (value <= thresholds.green) return 'text-emerald-400';
  if (value <= thresholds.yellow) return 'text-amber-400';
  return 'text-red-400';
}

export const CHANNEL_COLORS: Record<string, string> = {
  meta: '#1877F2',
  google: '#4285F4',
  shopify: '#96BF48',
  email: '#F59E0B',
  organic: '#8B5CF6',
  direct: '#6B7280',
};

export const CHANNEL_LABELS: Record<string, string> = {
  meta: 'Meta Ads',
  google: 'Google Ads',
  shopify: 'Shopify',
  email: 'Email',
  organic: 'Organic',
  direct: 'Direct',
};
