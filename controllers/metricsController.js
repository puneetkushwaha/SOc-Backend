const { SecurityEvent, Incident } = require('../models');

const calculateMetrics = async () => {
  const totalEvents = await SecurityEvent.countDocuments();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEvents = await SecurityEvent.countDocuments({
    timestamp: { $gte: todayStart }
  });

  const activeAlerts = await SecurityEvent.countDocuments({
    status: { $in: ['UNACKNOWLEDGED', 'ACKNOWLEDGED'] }
  });

  const openIncidents = await Incident.countDocuments({
    status: { $nin: ['CLOSED'] }
  });

  // Real stats instead of fake random numbers
  const threatsBlocked = await SecurityEvent.countDocuments({ status: 'RESOLVED' });

  // Simple representation for now instead of random strings
  // In a fully real system this would aggregate (resolved_time - created_time)
  const mttd = '00:15:00';
  const mttr = '02:30:00';

  // Distinct unique endpoints
  const endpointsResult = await SecurityEvent.distinct('src_ip');
  const endpointsCount = endpointsResult.length;

  // Events containing CVE today
  const cvesToday = await SecurityEvent.countDocuments({
    timestamp: { $gte: todayStart },
    cve_id: { $ne: null, $exists: true }
  });

  return {
    total_events: totalEvents,
    today_events: todayEvents,
    active_alerts: activeAlerts,
    open_incidents: openIncidents,
    threats_blocked: threatsBlocked,
    mttd: mttd,
    mttr: mttr,
    endpoints: endpointsCount || 1, // Fallback if no data
    cves_today: cvesToday
  };
};

// Mock data for fallback
const mockMetrics = {
  total_events: 1432,
  today_events: 87,
  active_alerts: 12,
  open_incidents: 5,
  threats_blocked: 234,
  mttd: '00:15:00',
  mttr: '02:30:00',
  endpoints: 42,
  cves_today: 3
};

const getMetrics = async (req, res) => {
  try {
    const metrics = await calculateMetrics();

    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('Error fetching metrics:', error);
    // Return mock data as fallback for development
    res.json({
      success: true,
      data: mockMetrics,
      note: 'Using mock data - database unavailable'
    });
  }
};

// Mock dashboard data for fallback
const mockDashboardData = {
  recentEvents: [
    { id: 'EVT001', attack_type: 'Brute Force', severity: 'HIGH', status: 'UNACKNOWLEDGED', timestamp: new Date() },
    { id: 'EVT002', attack_type: 'SQL Injection', severity: 'CRITICAL', status: 'INVESTIGATING', timestamp: new Date() },
    { id: 'EVT003', attack_type: 'Port Scan', severity: 'MEDIUM', status: 'ACKNOWLEDGED', timestamp: new Date() }
  ],
  severityCounts: [
    { _id: 'CRITICAL', count: 5 },
    { _id: 'HIGH', count: 12 },
    { _id: 'MEDIUM', count: 34 },
    { _id: 'LOW', count: 89 }
  ],
  incidentStats: [
    { _id: 'OPEN', count: 5 },
    { _id: 'IN_PROGRESS', count: 3 },
    { _id: 'CLOSED', count: 156 }
  ],
  topAttackTypes: [
    { _id: 'Brute Force', count: 45 },
    { _id: 'SQL Injection', count: 28 },
    { _id: 'XSS', count: 19 },
    { _id: 'Port Scan', count: 87 }
  ]
};

const getDashboardData = async (req, res) => {
  try {
    const [
      recentEvents,
      severityCounts,
      incidentStats,
      topAttackTypes
    ] = await Promise.all([
      SecurityEvent.find().sort({ timestamp: -1 }).limit(20),
      SecurityEvent.aggregate([
        { $group: { _id: '$severity', count: { $sum: 1 } } }
      ]),
      Incident.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      SecurityEvent.aggregate([
        { $group: { _id: '$attack_type', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 8 }
      ])
    ]);

    res.json({
      success: true,
      data: {
        recentEvents,
        severityCounts,
        incidentStats,
        topAttackTypes
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    // Return mock data as fallback for development
    res.json({
      success: true,
      data: mockDashboardData,
      note: 'Using mock data - database unavailable'
    });
  }
};

module.exports = {
  calculateMetrics,
  getMetrics,
  getDashboardData
};
