const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const compactInr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export const formatINR = (amount) => {
  if (amount == null || isNaN(amount)) return '₹0.00';
  return inrFormatter.format(amount);
};

export const formatINRCompact = (amount) => {
  if (amount == null || isNaN(amount)) return '₹0';
  return compactInr.format(amount);
};

export const formatChange = (change, percent) => {
  if (change == null) return '';
  const arrow = change >= 0 ? '▲' : '▼';
  const sign = change >= 0 ? '+' : '';
  return `${arrow} ${formatINR(Math.abs(change))} (${sign}${percent?.toFixed(2) || '0.00'}%)`;
};

export const formatPercent = (value) => {
  if (value == null || isNaN(value)) return '0.00%';
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
};

export const formatDate = (isoString) => {
  if (!isoString) return '';
  const d = new Date(isoString);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
};

export const formatDateShort = (isoString) => {
  if (!isoString) return '';
  const d = new Date(isoString);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
};

export const formatVolume = (vol) => {
  if (vol == null) return '0';
  if (vol >= 10000000) return `${(vol / 10000000).toFixed(1)}Cr`;
  if (vol >= 100000) return `${(vol / 100000).toFixed(1)}L`;
  if (vol >= 1000) return `${(vol / 1000).toFixed(1)}K`;
  return vol.toString();
};

export const formatNumber = (val) => {
  if (val == null || isNaN(val)) return '0.00';
  return val.toFixed(2);
};
