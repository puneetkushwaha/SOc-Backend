const axios = require('axios');

/**
 * SIEM Integration Service
 * Handles real-time data ingestion from Splunk and other SIEM tools
 */
class SIEMIntegrationService {
  constructor() {
    this.integrations = new Map();
    this.webhookSecrets = new Map();
  }

  /**
   * Register a new SIEM integration
   */
  async registerIntegration(config) {
    const { 
      name, 
      type, // 'splunk', 'siem', 'custom'
      url, 
      apiKey, 
      username, 
      password,
      searchQuery,
      pollingInterval = 60000 // Default 1 minute
    } = config;

    const integrationId = `${type}-${Date.now()}`;
    
    const integration = {
      id: integrationId,
      name,
      type,
      url,
      apiKey,
      username,
      password,
      searchQuery,
      pollingInterval,
      active: true,
      lastSync: null,
      status: 'initializing'
    };

    this.integrations.set(integrationId, integration);
    console.log(`✅ Registered ${type.toUpperCase()} integration: ${name}`);

    // Start polling for this integration
    this.startPolling(integrationId);

    return integration;
  }

  /**
   * Start polling data from SIEM
   */
  startPolling(integrationId) {
    const integration = this.integrations.get(integrationId);
    if (!integration || !integration.active) return;

    const poll = async () => {
      try {
        console.log(`🔄 Polling ${integration.type.toUpperCase()}: ${integration.name}...`);
        
        let events = [];

        if (integration.type === 'splunk') {
          events = await this.fetchFromSplunk(integration);
        } else if (integration.type === 'siem') {
          events = await this.fetchFromSIEM(integration);
        } else if (integration.type === 'custom') {
          events = await this.fetchFromCustomSource(integration);
        }

        integration.lastSync = new Date();
        integration.status = 'synced';
        
        if (events.length > 0) {
          console.log(`📊 Fetched ${events.length} real security events from ${integration.name}`);
          
          // Emit to WebSocket for real-time updates
          if (global.io) {
            global.io.emit('new_security_events', {
              source: integration.name,
              type: integration.type,
              count: events.length,
              events: events
            });
          }
        }

      } catch (error) {
        console.error(`❌ Error polling ${integration.name}:`, error.message);
        integration.status = 'error';
      }

      // Schedule next poll
      if (integration.active) {
        setTimeout(poll, integration.pollingInterval);
      }
    };

    // Start first poll immediately
    poll();
  }

  /**
   * Fetch events from Splunk Enterprise/Cloud
   */
  async fetchFromSplunk(integration) {
    const { url, apiKey, username, password, searchQuery } = integration;

    // Splunk REST API endpoint
    const splunkUrl = `${url}/services/search/jobs/export`;
    
    const auth = {
      headers: {}
    };

    if (apiKey) {
      auth.headers['Authorization'] = `Bearer ${apiKey}`;
    } else if (username && password) {
      auth.auth = { username, password };
    }

    const searchParams = new URLSearchParams({
      search: searchQuery || 'index=main severity=* | head 100',
      output_mode: 'json',
      earliest_time: '-5m',
      latest_time: 'now'
    });

    const response = await axios.post(splunkUrl, searchParams.toString(), auth);
    
    // Parse Splunk results (newline-delimited JSON)
    const events = [];
    const lines = response.data.split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      try {
        const result = JSON.parse(line);
        if (result._raw || result.result) {
          events.push(this.normalizeSplunkEvent(result));
        }
      } catch (e) {
        // Skip invalid JSON lines
      }
    }

    return events;
  }

  /**
   * Normalize Splunk event to standard format
   */
  normalizeSplunkEvent(splunkEvent) {
    const event = splunkEvent.result || splunkEvent._raw || splunkEvent;
    
    return {
      timestamp: event._time || event.timestamp || new Date(),
      severity: this.mapSeverity(event.severity || event.Priority || 'MEDIUM'),
      eventType: event.signature_id || event.EventID || event.EventType || 'Security Event',
      source: 'Splunk',
      sourceIp: event.src_ip || event.SourceIP || event.source || '',
      destinationIp: event.dest_ip || event.DestinationIP || event.destination || '',
      country: event.country || event.Country || '',
      city: event.city || event.City || '',
      description: event.signature || event.Message || event.description || 'Security event detected',
      rawLog: JSON.stringify(event),
      externalId: event._raw || event.id || null
    };
  }

  /**
   * Fetch from generic SIEM (supports QRadar, ArcSight, etc.)
   */
  async fetchFromSIEM(integration) {
    const { url, apiKey, username, password } = integration;

    const response = await axios.get(`${url}/api/events`, {
      headers: {
        'Authorization': apiKey ? `Bearer ${apiKey}` : '',
        'Content-Type': 'application/json'
      },
      auth: username && password ? { username, password } : undefined,
      params: {
        limit: 100,
        since: integration.lastSync || new Date(Date.now() - 300000) // Last 5 min
      }
    });

    return response.data.events.map(event => ({
      timestamp: event.timestamp || event.time,
      severity: this.mapSeverity(event.severity),
      eventType: event.type || event.category,
      source: 'SIEM',
      sourceIp: event.source_ip || event.src,
      destinationIp: event.destination_ip || event.dst,
      description: event.description || event.message,
      rawLog: JSON.stringify(event)
    }));
  }

  /**
   * Fetch from custom webhook/API source
   */
  async fetchFromCustomSource(integration) {
    const { url, apiKey } = integration;

    const response = await axios.get(url, {
      headers: {
        'Authorization': apiKey ? `Bearer ${apiKey}` : '',
        'Content-Type': 'application/json'
      }
    });

    return response.data.events || response.data || [];
  }

  /**
   * Map various severity levels to standard format
   */
  mapSeverity(rawSeverity) {
    const severityMap = {
      'low': 'LOW',
      'medium': 'MEDIUM',
      'high': 'HIGH',
      'critical': 'CRITICAL',
      'info': 'LOW',
      'warning': 'MEDIUM',
      'error': 'HIGH',
      'fatal': 'CRITICAL',
      '1': 'LOW',
      '2': 'MEDIUM',
      '3': 'HIGH',
      '4': 'CRITICAL'
    };

    const normalized = String(rawSeverity).toLowerCase();
    return severityMap[normalized] || 'MEDIUM';
  }

  /**
   * Get all active integrations
   */
  getActiveIntegrations() {
    return Array.from(this.integrations.values()).map(i => ({
      id: i.id,
      name: i.name,
      type: i.type,
      status: i.status,
      lastSync: i.lastSync,
      active: i.active
    }));
  }

  /**
   * Deactivate an integration
   */
  deactivateIntegration(integrationId) {
    const integration = this.integrations.get(integrationId);
    if (integration) {
      integration.active = false;
      console.log(`⏸️  Deactivated integration: ${integration.name}`);
    }
  }

  /**
   * Remove an integration
   */
  removeIntegration(integrationId) {
    const integration = this.integrations.get(integrationId);
    if (integration) {
      integration.active = false;
      this.integrations.delete(integrationId);
      console.log(`🗑️  Removed integration: ${integration.name}`);
    }
  }
}

module.exports = new SIEMIntegrationService();
