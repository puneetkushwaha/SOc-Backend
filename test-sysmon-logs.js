const axios = require('axios');

const API_URL = 'http://localhost:5000/api/webhooks/custom';

const sysmonEvents = [
  {
    id: `sysmon-1-${Date.now()}`,
    timestamp: new Date().toISOString(),
    severity: 'CRITICAL',
    type: 'Sysmon Event ID 1: Process Creation',
    source_ip: '192.168.1.15',
    destination_ip: '0.0.0.0',
    description: 'Suspicious process execution: powershell.exe -ExecutionPolicy Bypass -WindowStyle Hidden -EncodedCommand BASE64...',
    protocol: 'LOCAL',
    hostname: 'DESKTOP-SOC-01',
    location: { country: 'United States', city: 'Washington' }
  },
  {
    id: `sysmon-3-${Date.now()}`,
    timestamp: new Date().toISOString(),
    severity: 'HIGH',
    type: 'Sysmon Event ID 3: Network Connection',
    source_ip: '192.168.1.15',
    destination_ip: '45.33.22.11',
    description: 'Outbound connection to known malicious C2 server detected.',
    protocol: 'TCP/443',
    hostname: 'DESKTOP-SOC-01',
    location: { country: 'Russia', city: 'Moscow' }
  },
  {
    id: `sysmon-11-${Date.now()}`,
    timestamp: new Date().toISOString(),
    severity: 'HIGH',
    type: 'Sysmon Event ID 11: File Created',
    source_ip: '192.168.1.22',
    destination_ip: '0.0.0.0',
    description: 'File created in sensitive directory: C:\\Windows\\System32\\drivers\\etc\\hosts modified.',
    protocol: 'LOCAL',
    hostname: 'SERVER-DB-PROD',
    location: { country: 'Germany', city: 'Berlin' }
  }
];

async function runSimulation() {
  console.log('🚀 Starting Windows Sysmon Log Simulation...');
  
  try {
    const payload = {
      source: 'Windows Sysmon (Simulated)',
      events: sysmonEvents
    };

    console.log(`📤 Sending ${sysmonEvents.length} events to ${API_URL}...`);
    
    const response = await axios.post(API_URL, payload);
    
    if (response.data.success) {
      console.log('✅ Simulation Successful!');
      console.log(`📊 Response: ${response.data.message}`);
    } else {
      console.error('❌ Simulation Failed:', response.data.error);
    }
  } catch (error) {
    console.error('❌ Error connecting to SOC Backend:');
    if (error.code === 'ECONNREFUSED') {
      console.error('   Make sure your backend server is running on port 5000!');
    } else {
      console.error('   ' + (error.response?.data?.error || error.message));
    }
  }
}

runSimulation();
