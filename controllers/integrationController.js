const SecurityEvent = require('../models/SecurityEvent');
const { v4: uuidv4 } = require('uuid');
const { calculateMetrics } = require('./metricsController');

// Handle Splunk Webhook
// Splunk Webhook payload usually has { result: { ... }, sid, search_name, owner }
exports.handleSplunkWebhook = async (req, res) => {
  try {
    const payload = req.body;

    // Check if it's a valid Splunk Webhook payload
    if (!payload || !payload.result) {
      return res.status(400).json({ success: false, error: 'Invalid Splunk Webhook payload' });
    }

    const { result, search_name } = payload;

    // Map Splunk fields to our SecurityEvent model
    // Splunk alerts should ideally have these fields configured in the search query
    // e.g., result.severity, result.src_ip, result.dst_ip, etc.

    // Normalize severity constraint
    let severity = 'MEDIUM';
    if (result.severity) {
      const mappedSev = result.severity.toUpperCase();
      if (['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(mappedSev)) {
        severity = mappedSev;
      }
    } else if (search_name && search_name.toLowerCase().includes('critical')) {
      severity = 'CRITICAL';
    }

    const eventData = {
      id: `EVT-${uuidv4().substring(0, 8).toUpperCase()}`,
      timestamp: new Date(result._time ? result._time * 1000 : Date.now()),
      severity,
      src_ip: result.src_ip || result.source || '0.0.0.0',
      dst_ip: result.dst_ip || result.dest || '0.0.0.0',
      attack_type: result.attack_type || result.signature || search_name || 'Unknown',
      protocol: result.protocol || result.transport || 'Unknown',
      status: 'UNACKNOWLEDGED',
      cve_id: result.cve_id || null,
      mitre_technique: result.mitre_technique || null,
      description: result.description || `Splunk Alert: ${search_name}`,
      user_id: result.user || result.user_id || 'N/A',
      hostname: result.host || result.hostname || 'Unknown',
      location: {
        country: result.country || 'Unknown',
        city: result.city || 'Unknown',
        lat: parseFloat(result.lat) || 0,
        lng: parseFloat(result.lng) || 0
      }
    };

    const event = new SecurityEvent(eventData);
    await event.save();

    // Emit real-time event via socket
    if (req.io) {
      req.io.emit('new_event', eventData);

      const newMetrics = await calculateMetrics();
      req.io.emit('metrics_update', newMetrics);
    }

    res.status(200).json({ success: true, message: 'Splunk event ingested successfully', event: eventData });

  } catch (error) {
    console.error('Error handling Splunk webhook:', error);
    res.status(500).json({ success: false, error: 'Failed to process Splunk webhook' });
  }
};
