import { useState, useEffect } from 'react';
import { getSyncStatus, subscribeSyncStatus, type SyncStatus } from '../domain/syncEngine';
import './SyncIndicator.css';

export function useSyncStatusHook() {
  const [status, setStatus] = useState<SyncStatus>(getSyncStatus());

  useEffect(() => {
    return subscribeSyncStatus(setStatus);
  }, []);

  return status;
}

export default function SyncIndicator() {
  const status = useSyncStatusHook();

  const getStatusText = (s: SyncStatus) => {
    switch (s) {
      case 'synced':
        return 'Synced';
      case 'syncing':
        return 'Syncing';
      case 'offline':
        return 'Offline';
      case 'error':
        return 'Sync Error';
      default:
        return '';
    }
  };

  const getStatusIcon = (s: SyncStatus) => {
    switch (s) {
      case 'synced':
        return '✓';
      case 'syncing':
        return '⟳';
      case 'offline':
        return '⚡';
      case 'error':
        return '⚠';
      default:
        return '';
    }
  };

  return (
    <div className={`sync-indicator sync-status-${status}`} title={`Database sync status: ${getStatusText(status)}`}>
      <span className="sync-dot" />
      <span className="sync-text hide-mobile">
        {getStatusText(status)} {getStatusIcon(status)}
      </span>
    </div>
  );
}
