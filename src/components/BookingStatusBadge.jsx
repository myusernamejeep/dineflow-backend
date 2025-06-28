import { h } from 'preact';

export default function BookingStatusBadge({ status }) {
  const getStatusConfig = (status) => {
    switch (status) {
      case 'pending':
        return {
          label: 'Pending',
          color: '#f39c12',
          bgColor: '#fef5e7',
          icon: '⏳'
        };
      case 'confirmed':
        return {
          label: 'Confirmed',
          color: '#27ae60',
          bgColor: '#e8f5e8',
          icon: '✅'
        };
      case 'cancelled':
        return {
          label: 'Cancelled',
          color: '#e74c3c',
          bgColor: '#fdeaea',
          icon: '❌'
        };
      case 'checked-in':
        return {
          label: 'Checked In',
          color: '#3498db',
          bgColor: '#e8f4fd',
          icon: '🎉'
        };
      case 'completed':
        return {
          label: 'Completed',
          color: '#9b59b6',
          bgColor: '#f4e8f7',
          icon: '🏁'
        };
      default:
        return {
          label: 'Unknown',
          color: '#7f8c8d',
          bgColor: '#f8f9fa',
          icon: '❓'
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      padding: '4px 8px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: '500',
      color: config.color,
      backgroundColor: config.bgColor,
      border: `1px solid ${config.color}20`
    }}>
      <span style={{ fontSize: '10px' }}>{config.icon}</span>
      {config.label}
    </span>
  );
}
