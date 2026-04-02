const express = require('express');
const router = express.Router();
const Event = require('../models/SecurityEvent');
const Incident = require('../models/Incident');
const siemIntegrationService = require('../services/siemIntegrationService');
const { isDatabaseConnected } = require('../config/db');
const { webhookLimiter } = require('../middleware/rateLimiter');

// Apply webhook rate limiter to all webhook routes
router.use(webhookLimiter);

/**
 * POST /api/webhooks/splunk
 * Receive real-time security events from Splunk
 */
router.post('/splunk', async (req, res) => {
  try {
    console.log('📥 Received Splunk webhook');
    
    const eventData = req.body;
    const events = Array.isArray(eventData.results) ? eventData.results : [eventData];
    
    const processedEvents = [];

    for (const event of events) {
      // Normalize the event
      const normalizedEvent = {
        id: event.id || `splunk-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        timestamp: event._time || event.timestamp || new Date(),
        severity: mapSeverity(event.severity || event.Priority || 'MEDIUM'),
        attack_type: event.signature_id || event.EventID || event.signature || 'Security Alert',
        src_ip: event.src_ip || event.SourceIP || event.source || '0.0.0.0',
        dst_ip: event.dest_ip || event.DestinationIP || event.destination || '0.0.0.0',
        protocol: event.protocol || 'TCP',
        description: event.signature || event.Message || event.description || 'Security event from Splunk',
        location: {
          country: event.country || event.Country || '',
          city: event.city || event.City || ''
        }
      };

      // Save to database if connected
      if (isDatabaseConnected()) {
        const savedEvent = await Event.create(normalizedEvent);
        processedEvents.push(savedEvent);
        
        // Auto-create incident for CRITICAL/HIGH events
        if (normalizedEvent.severity === 'CRITICAL' || normalizedEvent.severity === 'HIGH') {
          await Incident.create({
            title: `${normalizedEvent.eventType} - ${normalizedEvent.severity}`,
            description: normalizedEvent.description,
            severity: normalizedEvent.severity,
            status: 'OPEN',
            relatedEvents: [savedEvent._id],
            timeline: [{
              timestamp: new Date(),
              action: 'Incident auto-created from high-severity event',
              user: 'System'
            }]
          });
        }
      } else {
        processedEvents.push(normalizedEvent);
      }
    }

    // Emit real-time WebSocket event
    if (global.io && processedEvents.length > 0) {
      global.io.emit('new_security_events', {
        source: 'Splunk',
        count: processedEvents.length,
        events: processedEvents
      });
    }

    console.log(`✅ Processed ${processedEvents.length} events from Splunk`);
    res.status(200).json({ 
      success: true, 
      message: `Processed ${processedEvents.length} events`,
      count: processedEvents.length
    });

  } catch (error) {
    console.error('❌ Error processing Splunk webhook:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * POST /api/webhooks/custom
 * Generic webhook for custom SIEM/tools
 */
router.post('/custom', async (req, res) => {
  try {
    console.log('📥 Received custom webhook');
    
    const payload = req.body;
    const events = Array.isArray(payload.events) ? payload.events : [payload];
    
    const processedEvents = events.map(event => ({
      id: event.id || `custom-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: event.timestamp || new Date(),
      severity: mapSeverity(event.severity || 'MEDIUM'),
      attack_type: event.attack_type || event.type || event.eventType || 'Security Event',
      src_ip: event.src_ip || event.source_ip || '0.0.0.0',
      dst_ip: event.dst_ip || event.destination_ip || '0.0.0.0',
      protocol: event.protocol || 'HTTP',
      description: event.description || event.message || 'Security event detected',
      location: {
        country: event.country || '',
        city: event.city || ''
      }
    }));

    // Save events
    const savedEvents = [];
    if (isDatabaseConnected()) {
      for (const event of processedEvents) {
        const saved = await Event.create(event);
        savedEvents.push(saved);
      }
    } else {
      savedEvents.push(...processedEvents);
    }

    // Emit WebSocket event
    if (global.io && savedEvents.length > 0) {
      global.io.emit('new_security_events', {
        source: payload.source || 'Custom',
        count: savedEvents.length,
        events: savedEvents
      });
    }

    console.log(`✅ Processed ${savedEvents.length} custom events`);
    res.status(200).json({ 
      success: true, 
      message: `Processed ${savedEvents.length} events`,
      count: savedEvents.length
    });

  } catch (error) {
    console.error('❌ Error processing custom webhook:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * POST /api/webhooks/register
 * Register a new SIEM integration with URL
 */
router.post('/register', async (req, res) => {
  try {
    const { name, type, url, apiKey, username, password, searchQuery, pollingInterval } = req.body;

    if (!name || !type || !url) {
      return res.status(400).json({
        success: false,
        error: 'Name, type, and URL are required'
      });
    }

    const integration = await siemIntegrationService.registerIntegration({
      name,
      type: type.toLowerCase(), // 'splunk', 'siem', 'custom'
      url,
      apiKey,
      username,
      password,
      searchQuery,
      pollingInterval
    });

    console.log(`✅ Registered new integration: ${name} (${type})`);
    
    res.status(201).json({
      success: true,
      message: 'Integration registered successfully',
      integration
    });

  } catch (error) {
    console.error('❌ Error registering integration:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * GET /api/webhooks/integrations
 * List all active integrations
 */
router.get('/integrations', (req, res) => {
  try {
    const integrations = siemIntegrationService.getActiveIntegrations();
    
    res.status(200).json({
      success: true,
      count: integrations.length,
      integrations
    });

  } catch (error) {
    console.error('❌ Error getting integrations:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * DELETE /api/webhooks/integrations/:id
 * Remove an integration
 */
router.delete('/integrations/:id', (req, res) => {
  try {
    const { id } = req.params;
    siemIntegrationService.removeIntegration(id);
    
    res.status(200).json({
      success: true,
      message: 'Integration removed'
    });

  } catch (error) {
    console.error('❌ Error removing integration:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Helper function
function mapSeverity(rawSeverity) {
  const severityMap = {
    'low': 'LOW',
    'medium': 'MEDIUM',
    'high': 'HIGH',
    'critical': 'CRITICAL',
    'info': 'LOW',
    'warning': 'MEDIUM',
    'error': 'HIGH',
    'fatal': 'CRITICAL'
  };

  const normalized = String(rawSeverity).toLowerCase();
  return severityMap[normalized] || 'MEDIUM';
}

module.exports = router;
