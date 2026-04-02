const splunkThreatMap = {
  'Brute Force Detection': 'Brute Force',
  'Brute Force': 'Brute Force',
  'Failed Login Attempts': 'Brute Force',
  'phishing': 'Phishing',
  'Phishing Email Alert': 'Phishing',
  'Phishing': 'Phishing',
  'Suspicious Email': 'Phishing',
  'malware': 'Malware',
  'Malware Beaconing Detected': 'Malware',
  'Malware': 'Malware',
  'C2 Communication': 'Malware',
  'Ransomware': 'Malware',
  'ddos': 'DDoS',
  'DDoS Traffic Spike': 'DDoS',
  'DDoS': 'DDoS',
  'Volumetric Attack': 'DDoS',
  'port scan': 'Port Scan',
  'Port Scan Activity': 'Port Scan',
  'Port Scan': 'Port Scan',
  'Reconnaissance': 'Port Scan',
  'command injection': 'Command Injection',
  'Command Injection Attempt': 'Command Injection',
  'Command Injection': 'Command Injection',
  'SQL Injection': 'SQL Injection',
  'sql injection': 'SQL Injection',
  'XSS': 'XSS',
  'xss': 'XSS',
  'Cross-Site Scripting': 'XSS',
  'dns tunneling': 'DNS Tunneling',
  'DNS Tunneling Suspicion': 'DNS Tunneling',
  'DNS Tunneling': 'DNS Tunneling',
  'data exfiltration': 'Data Exfiltration',
  'Data Exfiltration Alert': 'Data Exfiltration',
  'Data Exfiltration': 'Data Exfiltration',
  'insider threat': 'Insider Threat',
  'Insider Threat Behavior': 'Insider Threat',
  'Insider Threat': 'Insider Threat',
  'privilege escalation': 'Privilege Escalation',
  'Privilege Escalation': 'Privilege Escalation',
  'unauthorized access': 'Unauthorized Access',
  'Unauthorized Access': 'Unauthorized Access',
  'unauthorized': 'Unauthorized Access'
};

function mapSplunkAlertToThreatType(searchName) {
  if (!searchName) return 'Unknown Threat';
  
  const normalizedSearch = searchName.toLowerCase();
  
  for (const [key, threatType] of Object.entries(splunkThreatMap)) {
    if (normalizedSearch.includes(key.toLowerCase())) {
      return threatType;
    }
  }
  
  return 'Unknown Threat';
}

function getSeverityLevel(severity) {
  if (!severity) return 'MEDIUM';
  
  const sev = severity.toUpperCase();
  if (['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].includes(sev)) {
    return sev;
  }
  
  if (sev.includes('CRIT')) return 'CRITICAL';
  if (sev.includes('HIGH')) return 'HIGH';
  if (sev.includes('MED')) return 'MEDIUM';
  if (sev.includes('LOW')) return 'LOW';
  
  return 'MEDIUM';
}

module.exports = {
  splunkThreatMap,
  mapSplunkAlertToThreatType,
  getSeverityLevel
};
