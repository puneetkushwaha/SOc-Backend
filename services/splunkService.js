const axios = require('axios');

const config = require('../config/config');

class SplunkService {
  constructor() {
    this.baseUrl = process.env.SPLUNK_BASE_URL;
    this.username = process.env.SPLUNK_USERNAME;
    this.password = process.env.SPLUNK_PASSWORD;
    this.searchQuery = process.env.SPLUNK_SEARCH_QUERY || 'index=security';
    this.isConfigured = !!(this.baseUrl && this.username && this.password);
  }

  getAuthHeader() {
    return Buffer.from(`${this.username}:${this.password}`).toString('base64');
  }

  async fetchLatestAlert() {
    if (!this.isConfigured) {
      console.log('[SplunkService] Splunk credentials not configured. Running in demo mode.');
      return this.getDemoAlert();
    }

    try {
      const searchJob = await this.createSearchJob();
      const results = await this.getSearchResults(searchJob.sid);
      
      if (results.results && results.results.length > 0) {
        return this.formatSplunkResult(results.results[0]);
      }
      
      return null;
    } catch (error) {
      console.error('[SplunkService] Error fetching Splunk alert:', error.message);
      return this.getDemoAlert();
    }
  }

  async createSearchJob() {
    const response = await axios.post(
      `${this.baseUrl}/services/search/jobs`,
      `search=${encodeURIComponent(this.searchQuery)}&earliest_time=-5m&latest_time=now&output_mode=json`,
      {
        headers: {
          'Authorization': `Basic ${this.getAuthHeader()}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    return { sid: response.data.sid };
  }

  async getSearchResults(sid) {
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
      const response = await axios.get(
        `${this.baseUrl}/services/search/jobs/${sid}/results?output_mode=json&count=1`,
        {
          headers: {
            'Authorization': `Basic ${this.getAuthHeader()}`
          }
        }
      );

      if (response.data.results && response.data.results.length > 0) {
        return response.data;
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
    }

    return { results: [] };
  }

  formatSplunkResult(result) {
    return {
      searchName: result.search_name || result.searchName || 'Unknown Alert',
      severity: result.severity || result.severity_level || 'MEDIUM',
      sourceIp: result.src_ip || result.sourceIp || result.src || '0.0.0.0',
      destIp: result.dest_ip || result.destIp || result.dst || '0.0.0.0',
      attackType: result.attack_type || result.attackType || result.signature || 'Unknown',
      timestamp: result._time || result.timestamp || new Date().toISOString(),
      raw: result
    };
  }

  getDemoAlert() {
    const demoAlerts = [
      {
        searchName: 'Brute Force Detection',
        severity: 'HIGH',
        sourceIp: '192.168.1.105',
        destIp: '10.0.0.50',
        attackType: 'Failed Login Attempts',
        timestamp: new Date().toISOString()
      },
      {
        searchName: 'Phishing Email Alert',
        severity: 'MEDIUM',
        sourceIp: '185.234.72.15',
        destIp: '10.0.0.25',
        attackType: 'Suspicious Email',
        timestamp: new Date().toISOString()
      },
      {
        searchName: 'Malware Beaconing Detected',
        severity: 'CRITICAL',
        sourceIp: '10.0.0.100',
        destIp: '45.33.32.156',
        attackType: 'C2 Communication',
        timestamp: new Date().toISOString()
      },
      {
        searchName: 'DDoS Traffic Spike',
        severity: 'HIGH',
        sourceIp: '203.0.113.50',
        destIp: '10.0.0.1',
        attackType: 'Volumetric Attack',
        timestamp: new Date().toISOString()
      },
      {
        searchName: 'Port Scan Activity',
        severity: 'MEDIUM',
        sourceIp: '198.51.100.22',
        destIp: '10.0.0.75',
        attackType: 'Reconnaissance',
        timestamp: new Date().toISOString()
      }
    ];

    return demoAlerts[Math.floor(Math.random() * demoAlerts.length)];
  }
}

module.exports = new SplunkService();
