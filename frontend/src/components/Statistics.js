
/**
 * Statistics Component - Display real-time metrics
 */
import React from 'react';

const Statistics = ({ stats, history }) => {
  if (!stats) {
    return (
      <div style={styles.container}>
        <h3 style={styles.title}>📊 System Statistics</h3>
        <p style={styles.loading}>Loading statistics...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>📊 Real-Time Statistics</h3>

      {/* Fleet Overview */}
      <div style={styles.section}>
        <h4 style={styles.sectionTitle}>🚌 Fleet Overview</h4>
        <div style={styles.statGrid}>
          <StatCard
            label="Total Buses"
            value={stats.num_buses || 0}
            icon="🚌"
            color="#4ECDC4"
          />
          <StatCard
            label="Buses in Transit"
            value={stats.buses_in_transit || 0}
            icon="🚛"
            color="#2ECC71"
          />
          <StatCard
            label="Avg Occupancy"
            value={`${((stats.average_bus_occupancy || 0) * 100).toFixed(1)}%`}
            icon="👥"
            color="#3498DB"
          />
          <StatCard
            label="Simulation Time"
            value={`${(stats.simulation_time || 0).toFixed(0)}s`}
            icon="⏱️"
            color="#9B59B6"
          />
        </div>
      </div>

      {/* Passenger Metrics */}
      <div style={styles.section}>
        <h4 style={styles.sectionTitle}>👥 Passenger Metrics</h4>
        <div style={styles.statGrid}>
          <StatCard
            label="Total Served"
            value={stats.total_passengers_served || 0}
            icon="✅"
            color="#2ECC71"
          />
          <StatCard
            label="Currently Waiting"
            value={stats.total_passengers_waiting || 0}
            icon="⏳"
            color="#F39C12"
          />
          <StatCard
            label="Avg Wait Time"
            value={`${(stats.average_wait_time || 0).toFixed(1)}s`}
            icon="⏱️"
            color="#E74C3C"
          />
          <StatCard
            label="On Board"
            value={stats.total_passengers_on_buses || 0}
            icon="🚌"
            color="#3498DB"
          />
        </div>
      </div>

      {/* Performance Chart */}
      {history && history.length > 0 && (
        <div style={styles.section}>
          <h4 style={styles.sectionTitle}>📈 Performance Trends</h4>
          <div style={styles.chartContainer}>
            <div style={styles.chartLegend}>
              <span style={{ color: '#2ECC71' }}>● Wait Time</span>
              <span style={{ color: '#3498DB' }}>● Passengers Served</span>
            </div>
            <div style={styles.chartInfo}>
              <p style={styles.chartText}>
                Last {history.length} data points recorded
              </p>
              <p style={styles.chartText}>
                Current wait time: {(history[history.length - 1]?.waitTime || 0).toFixed(1)}s
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper component for stat cards
const StatCard = ({ label, value, icon, color }) => (
  <div style={{ ...styles.statCard, borderLeftColor: color }}>
    <div style={styles.statIcon}>{icon}</div>
    <div style={styles.statContent}>
      <div style={styles.statValue}>{value}</div>
      <div style={styles.statLabel}>{label}</div>
    </div>
  </div>
);

const styles = {
  container: {
    padding: '20px',
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    height: '100%',
    overflowY: 'auto',
  },
  title: {
    margin: '0 0 20px 0',
    fontSize: '20px',
    color: '#2C3E50',
    borderBottom: '2px solid #4ECDC4',
    paddingBottom: '10px',
  },
  loading: {
    textAlign: 'center',
    color: '#95A5A6',
    padding: '40px 0',
  },
  section: {
    marginBottom: '24px',
  },
  sectionTitle: {
    margin: '0 0 12px 0',
    fontSize: '16px',
    color: '#34495E',
    fontWeight: '600',
  },
  statGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
  },
  statCard: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px',
    backgroundColor: '#F8F9FA',
    borderRadius: '8px',
    borderLeft: '4px solid',
  },
  statIcon: {
    fontSize: '24px',
    marginRight: '12px',
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  statLabel: {
    fontSize: '11px',
    color: '#7F8C8D',
    marginTop: '2px',
  },
  chartContainer: {
    backgroundColor: '#F8F9FA',
    padding: '16px',
    borderRadius: '8px',
  },
  chartLegend: {
    display: 'flex',
    gap: '20px',
    marginBottom: '12px',
    fontSize: '12px',
  },
  chartInfo: {
    fontSize: '12px',
    color: '#666',
  },
  chartText: {
    margin: '4px 0',
  },
};

export default Statistics;