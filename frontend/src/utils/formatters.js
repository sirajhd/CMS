/**
 * Construction Management System (CMS) — Domain Formatting Utilities
 */

export function formatCurrency(amount) {
  if (amount === undefined || amount === null || isNaN(Number(amount))) {
    return '0.00 ETB';
  }
  const numericValue = Number(amount);
  return `${numericValue.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ETB`;
}

export function formatDate(dateString) {
  if (!dateString) return '—';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export function formatDateTime(dateString) {
  if (!dateString) return '—';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

export function getStatusStyle(status) {
  const normalized = (status || '').toLowerCase().trim();

  switch (normalized) {
    case 'approved':
    case 'paid':
    case 'delivered':
    case 'completed':
    case 'active':
      return {
        label: status,
        bg: 'bg-emerald-950/60',
        text: 'text-emerald-300',
        border: 'border-emerald-500/40',
        dot: 'bg-emerald-400',
      };

    case 'submitted':
    case 'draft':
    case 'ordered':
      return {
        label: status,
        bg: 'bg-sky-950/60',
        text: 'text-sky-300',
        border: 'border-sky-500/40',
        dot: 'bg-sky-400',
      };

    case 'under review':
    case 'pending':
    case 'in review':
      return {
        label: status,
        bg: 'bg-amber-950/60',
        text: 'text-amber-300',
        border: 'border-amber-500/40',
        dot: 'bg-amber-400',
      };

    case 'processing':
    case 'sent to manager':
      return {
        label: status,
        bg: 'bg-indigo-950/60',
        text: 'text-indigo-300',
        border: 'border-indigo-500/40',
        dot: 'bg-indigo-400',
      };

    case 'revision required':
      return {
        label: status,
        bg: 'bg-orange-950/60',
        text: 'text-orange-300',
        border: 'border-orange-500/40',
        dot: 'bg-orange-400',
      };

    case 'rejected':
      return {
        label: status,
        bg: 'bg-rose-950/60',
        text: 'text-rose-300',
        border: 'border-rose-500/40',
        dot: 'bg-rose-400',
      };

    default:
      return {
        label: status || 'Unknown',
        bg: 'bg-slate-800/80',
        text: 'text-slate-300',
        border: 'border-slate-700',
        dot: 'bg-slate-400',
      };
  }
}

export default {
  formatCurrency,
  formatDate,
  formatDateTime,
  getStatusStyle,
};
