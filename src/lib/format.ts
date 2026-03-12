export function formatCurrency(value: number, decimals = 0): string {
  if (Math.abs(value) >= 1000) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatCompactCurrency(value: number): string {
  if (Math.abs(value) >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(value) >= 1_000) {
    return `$${(value / 1_000).toFixed(1)}k`;
  }
  return `$${value.toFixed(0)}`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export function formatMultiplier(value: number): string {
  return `${value.toFixed(1)}x`;
}

export function formatTrend(changePct: number, invert = false): {
  arrow: string;
  color: string;
  label: string;
} {
  const isPositiveChange = changePct > 0;
  const isGood = invert ? !isPositiveChange : isPositiveChange;

  if (Math.abs(changePct) < 1) {
    return { arrow: '—', color: 'text-zinc-500', label: 'Stable' };
  }

  return {
    arrow: isGood ? '▲' : '▼',
    color: isGood ? 'text-emerald-400' : 'text-red-400',
    label: `${changePct > 0 ? '+' : ''}${changePct.toFixed(1)}%`,
  };
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}m ${secs.toFixed(0)}s`;
}
