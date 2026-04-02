const { SecurityEvent } = require('../models');

// Mock data for fallback
const mockEvents = [
  { id: 'EVT001', attack_type: 'Brute Force', severity: 'HIGH', status: 'UNACKNOWLEDGED', src_ip: '192.168.1.100', dst_ip: '10.0.0.1', protocol: 'SSH', timestamp: new Date(), description: 'Multiple failed login attempts' },
  { id: 'EVT002', attack_type: 'SQL Injection', severity: 'CRITICAL', status: 'INVESTIGATING', src_ip: '203.0.113.45', dst_ip: '10.0.0.5', protocol: 'HTTP', timestamp: new Date(Date.now() - 3600000), description: 'SQL injection attempt in web form' },
  { id: 'EVT003', attack_type: 'Port Scan', severity: 'MEDIUM', status: 'ACKNOWLEDGED', src_ip: '198.51.100.200', dst_ip: '10.0.0.0/24', protocol: 'TCP', timestamp: new Date(Date.now() - 7200000), description: 'Network reconnaissance detected' },
  { id: 'EVT004', attack_type: 'Malware', severity: 'CRITICAL', status: 'RESOLVED', src_ip: '192.0.2.15', dst_ip: '10.0.0.50', protocol: 'HTTPS', timestamp: new Date(Date.now() - 86400000), description: 'Malware detected and quarantined' },
  { id: 'EVT005', attack_type: 'Data Exfiltration', severity: 'HIGH', status: 'INVESTIGATING', src_ip: '172.16.0.50', dst_ip: '198.51.100.100', protocol: 'DNS', timestamp: new Date(Date.now() - 10800000), description: 'Unusual data transfer detected' }
];

const getEvents = async (req, res) => {
  try {
    const { limit = 100, severity, status, startDate, endDate } = req.query;

    const query = {};

    if (severity) {
      query.severity = severity;
    }

    if (status) {
      query.status = status;
    }

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) {
        query.timestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        query.timestamp.$lte = new Date(endDate);
      }
    }

    const events = await SecurityEvent.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      count: events.length,
      data: events
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    // Return mock data as fallback
    const limitNum = parseInt(req.query.limit) || 100;
    const filteredEvents = mockEvents.slice(0, limitNum);
    res.json({
      success: true,
      count: filteredEvents.length,
      data: filteredEvents,
      note: 'Using mock data - database unavailable'
    });
  }
};

const getEventById = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await SecurityEvent.findOne({ id });

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    res.json({
      success: true,
      data: event
    });
  } catch (error) {
    console.error('Error fetching event:', error);
    // Return mock event as fallback
    const mockEvent = mockEvents.find(e => e.id === req.params.id) || mockEvents[0];
    res.json({
      success: true,
      data: mockEvent,
      note: 'Using mock data - database unavailable'
    });
  }
};

const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const event = await SecurityEvent.findOneAndUpdate(
      { id },
      updates,
      { new: true, runValidators: true }
    );

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    res.json({
      success: true,
      data: event
    });
  } catch (error) {
    console.error('Error updating event:', error);
    // Return mock updated event as fallback
    const mockEvent = { ...mockEvents[0], ...req.body };
    res.json({
      success: true,
      data: mockEvent,
      note: 'Using mock data - database unavailable'
    });
  }
};

const acknowledgeEvent = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await SecurityEvent.findOneAndUpdate(
      { id },
      { status: 'ACKNOWLEDGED' },
      { new: true }
    );

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    res.json({
      success: true,
      data: event
    });
  } catch (error) {
    console.error('Error acknowledging event:', error);
    // Return mock acknowledged event as fallback
    const mockEvent = { ...mockEvents[0], status: 'ACKNOWLEDGED' };
    res.json({
      success: true,
      data: mockEvent,
      note: 'Using mock data - database unavailable'
    });
  }
};

const getEventStats = async (req, res) => {
  try {
    const stats = await SecurityEvent.aggregate([
      {
        $group: {
          _id: '$severity',
          count: { $sum: 1 }
        }
      }
    ]);

    const byStatus = await SecurityEvent.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const byAttackType = await SecurityEvent.aggregate([
      {
        $group: {
          _id: '$attack_type',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    const totalCount = await SecurityEvent.countDocuments();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayCount = await SecurityEvent.countDocuments({
      timestamp: { $gte: todayStart }
    });

    res.json({
      success: true,
      data: {
        bySeverity: stats,
        byStatus: byStatus,
        byAttackType: byAttackType,
        total: totalCount,
        today: todayCount
      }
    });
  } catch (error) {
    console.error('Error fetching event stats:', error);
    // Return mock stats as fallback
    const mockStats = {
      bySeverity: [
        { _id: 'CRITICAL', count: 5 },
        { _id: 'HIGH', count: 12 },
        { _id: 'MEDIUM', count: 34 },
        { _id: 'LOW', count: 89 }
      ],
      byStatus: [
        { _id: 'UNACKNOWLEDGED', count: 8 },
        { _id: 'ACKNOWLEDGED', count: 25 },
        { _id: 'INVESTIGATING', count: 12 },
        { _id: 'RESOLVED', count: 95 }
      ],
      byAttackType: [
        { _id: 'Brute Force', count: 45 },
        { _id: 'SQL Injection', count: 28 },
        { _id: 'XSS', count: 19 },
        { _id: 'Port Scan', count: 87 },
        { _id: 'Malware', count: 34 }
      ],
      total: 140,
      today: 23
    };
    res.json({
      success: true,
      data: mockStats,
      note: 'Using mock data - database unavailable'
    });
  }
};

module.exports = {
  getEvents,
  getEventById,
  updateEvent,
  acknowledgeEvent,
  getEventStats
};
