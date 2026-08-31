export function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString();
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

export function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'CRITICAL': return 'badge-red';
    case 'HIGH': return 'badge-yellow';
    case 'MEDIUM': return 'badge-blue';
    case 'LOW': return 'badge-gray';
    default: return 'badge-gray';
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'COMPLETED': return 'badge-green';
    case 'IN_PROGRESS': return 'badge-blue';
    case 'BLOCKED': return 'badge-red';
    case 'TODO': return 'badge-gray';
    default: return 'badge-gray';
  }
}