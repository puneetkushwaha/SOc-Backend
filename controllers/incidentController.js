const { Incident } = require('../models');

const getIncidents = async (req, res) => {
  try {
    const { status, severity, assigned_to, limit = 50 } = req.query;
    
    const query = {};
    
    if (status) {
      query.status = status;
    }
    
    if (severity) {
      query.severity = severity;
    }
    
    if (assigned_to) {
      query.assigned_to = assigned_to;
    }
    
    const incidents = await Incident.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    
    res.json({
      success: true,
      count: incidents.length,
      data: incidents
    });
  } catch (error) {
    console.error('Error fetching incidents:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch incidents'
    });
  }
};

const getIncidentById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const incident = await Incident.findOne({ id });
    
    if (!incident) {
      return res.status(404).json({
        success: false,
        error: 'Incident not found'
      });
    }
    
    res.json({
      success: true,
      data: incident
    });
  } catch (error) {
    console.error('Error fetching incident:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch incident'
    });
  }
};

const createIncident = async (req, res) => {
  try {
    const incidentData = req.body;
    
    const year = new Date().getFullYear();
    const count = await Incident.countDocuments() + 1;
    incidentData.id = `INC-${year}-${count.toString().padStart(3, '0')}`;
    
    if (!incidentData.sla_deadline) {
      const severityHours = {
        'CRITICAL': 4,
        'HIGH': 8,
        'MEDIUM': 24,
        'LOW': 48
      };
      const hours = severityHours[incidentData.severity] || 24;
      incidentData.sla_deadline = new Date(Date.now() + hours * 60 * 60 * 1000);
    }
    
    const incident = new Incident(incidentData);
    await incident.save();
    
    res.status(201).json({
      success: true,
      data: incident
    });
  } catch (error) {
    console.error('Error creating incident:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create incident'
    });
  }
};

const updateIncident = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    if (updates.status) {
      updates.timeline = {
        action: 'status_change',
        user: req.body.user || 'System',
        timestamp: new Date(),
        notes: `Status changed to ${updates.status}`
      };
    }
    
    const incident = await Incident.findOneAndUpdate(
      { id },
      updates,
      { new: true, runValidators: true }
    );
    
    if (!incident) {
      return res.status(404).json({
        success: false,
        error: 'Incident not found'
      });
    }
    
    res.json({
      success: true,
      data: incident
    });
  } catch (error) {
    console.error('Error updating incident:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update incident'
    });
  }
};

const deleteIncident = async (req, res) => {
  try {
    const { id } = req.params;
    
    const incident = await Incident.findOneAndDelete({ id });
    
    if (!incident) {
      return res.status(404).json({
        success: false,
        error: 'Incident not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Incident deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting incident:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete incident'
    });
  }
};

const getIncidentStats = async (req, res) => {
  try {
    const byStatus = await Incident.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const bySeverity = await Incident.aggregate([
      {
        $group: {
          _id: '$severity',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const total = await Incident.countDocuments();
    const openIncidents = await Incident.countDocuments({
      status: { $nin: ['CLOSED'] }
    });
    
    res.json({
      success: true,
      data: {
        byStatus,
        bySeverity,
        total,
        open: openIncidents
      }
    });
  } catch (error) {
    console.error('Error fetching incident stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch incident statistics'
    });
  }
};

module.exports = {
  getIncidents,
  getIncidentById,
  createIncident,
  updateIncident,
  deleteIncident,
  getIncidentStats
};
