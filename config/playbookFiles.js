const path = require('path');

const PLAYBOOKS_DIR = path.join(__dirname, '..', '..', 'Playbooks');

const playbookFileMap = {
  'IR-PB-002': { fileName: 'DNS_Tunneling_Playbook.docx', slug: 'dns-tunneling', name: 'DNS Tunneling' },
  'IR-PB-010': { fileName: 'Playbook_Brute_Force.docx', slug: 'brute-force', name: 'Brute Force' },
  'IR-PB-003': { fileName: 'Playbook_Command_Injection.docx', slug: 'command-injection', name: 'Command Injection' },
  'IR-PB-015': { fileName: 'Playbook_Data_Exfiltration.docx', slug: 'data-exfiltration', name: 'Data Exfiltration' },
  'IR-PB-007': { fileName: 'Playbook_DDoS.docx', slug: 'ddos', name: 'DDoS' },
  'IR-PB-014': { fileName: 'Playbook_Insider_Threat.docx', slug: 'insider-threat', name: 'Insider Threat' },
  'IR-PB-006': { fileName: 'Playbook_Malware.docx', slug: 'malware', name: 'Malware' },
  'IR-PB-005': { fileName: 'Playbook_Phishing.docx', slug: 'phishing', name: 'Phishing' },
  'IR-PB-011': { fileName: 'Playbook_Port_Scan.docx', slug: 'port-scan', name: 'Port Scan' },
  'IR-PB-012': { fileName: 'Playbook_Privilege_Escalation.docx', slug: 'privilege-escalation', name: 'Privilege Escalation' },
  'IR-PB-013': { fileName: 'Playbook_Ransomware.docx', slug: 'ransomware', name: 'Ransomware' },
  'IR-PB-009': { fileName: 'Playbook_SQL_Injection.docx', slug: 'sql-injection', name: 'SQL Injection' },
  'IR-PB-004': { fileName: 'Playbook_Unauthorized_Access.docx', slug: 'unauthorized-access', name: 'Unauthorized Access' },
  'IR-PB-008': { fileName: 'Playbook_XSS.docx', slug: 'xss', name: 'XSS' }
};

const getPlaybookFilePath = (playbookId) => {
  const playbook = playbookFileMap[playbookId];
  if (!playbook) return null;
  return path.join(PLAYBOOKS_DIR, playbook.fileName);
};

const getPlaybookById = (playbookId) => {
  return playbookFileMap[playbookId] || null;
};

const getAllPlaybookFiles = () => {
  return Object.entries(playbookFileMap).map(([id, data]) => ({
    id,
    ...data
  }));
};

module.exports = {
  PLAYBOOKS_DIR,
  playbookFileMap,
  getPlaybookFilePath,
  getPlaybookById,
  getAllPlaybookFiles
};
