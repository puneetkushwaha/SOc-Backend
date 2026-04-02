const { mapSplunkAlertToThreatType, getSeverityLevel } = require('./splunkThreatMap');
const { v4: uuidv4 } = require('uuid');

function normalizeSplunkAlert(rawAlert) {
  if (!rawAlert) {
    return null;
  }

  const searchName = rawAlert.searchName || rawAlert.search_name || 'Unknown Alert';
  const threatType = mapSplunkAlertToThreatType(searchName);
  const severity = getSeverityLevel(rawAlert.severity);
  
  const timestamp = rawAlert.timestamp 
    ? new Date(rawAlert.timestamp).toISOString()
    : new Date().toISOString();

  const formattedTimestamp = new Date(timestamp).toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  const normalized = {
    id: `ALT-${uuidv4().substring(0, 8).toUpperCase()}`,
    type: threatType,
    severity: severity,
    sourceIp: rawAlert.sourceIp || rawAlert.src_ip || rawAlert.sourceIp || '0.0.0.0',
    destIp: rawAlert.destIp || rawAlert.dest_ip || rawAlert.destIp || '0.0.0.0',
    status: 'Active',
    timestamp: formattedTimestamp,
    timestampRaw: timestamp,
    description: generateDescription(threatType, rawAlert),
    rawSource: 'Splunk',
    searchName: searchName,
    attackType: rawAlert.attackType || rawAlert.attack_type || 'Unknown'
  };

  return normalized;
}

function generateDescription(threatType, rawAlert) {
  const descriptions = {
    'Brute Force': `Multiple failed login attempts detected from ${rawAlert.sourceIp || 'unknown source'}. Potential credential stuffing attack.`,
    'Phishing': `Suspicious email detected from ${rawAlert.sourceIp || 'unknown source'}. User clicked malicious link or attachment.`,
    'Malware': `Malware activity detected. Possible beaconing to C2 server at ${rawAlert.destIp || 'unknown destination'}.`,
    'DDoS': `Abnormal traffic spike detected. Volumetric attack targeting ${rawAlert.destIp || 'network'}.`,
    'Port Scan': `Reconnaissance activity detected. Port scan from ${rawAlert.sourceIp || 'unknown source'}.`,
    'Command Injection': `Command injection attempt detected from ${rawAlert.sourceIp || 'unknown source'}.`,
    'SQL Injection': `SQL injection attempt detected. Malicious payload in ${rawAlert.attackType || 'request'}.`,
    'XSS': `Cross-site scripting attempt detected from ${rawAlert.sourceIp || 'unknown source'}.`,
    'DNS Tunneling': `Suspicious DNS query pattern detected. Possible data exfiltration via DNS.`,
    'Data Exfiltration': `Large data transfer detected to external destination ${rawAlert.destIp || 'unknown'}.`,
    'Insider Threat': `Anomalous user behavior detected. Possible insider threat activity.`,
    'Privilege Escalation': `Privilege escalation attempt detected from ${rawAlert.sourceIp || 'unknown source'}.`,
    'Unauthorized Access': `Unauthorized access attempt detected from ${rawAlert.sourceIp || 'unknown source'}.`,
    'Unknown Threat': `Security alert triggered: ${rawAlert.searchName || 'Unknown Alert Type'}`
  };

  return descriptions[threatType] || descriptions['Unknown Threat'];
}

module.exports = {
  normalizeSplunkAlert
};
