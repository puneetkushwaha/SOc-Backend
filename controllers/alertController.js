const splunkService = require('../services/splunkService');
const { normalizeSplunkAlert } = require('../utils/normalizeSplunkAlert');

let cachedAlert = null;
let lastFetchTime = null;
const CACHE_DURATION_MS = 30000;

exports.getLatestAlert = async (req, res) => {
  try {
    const now = Date.now();
    
    if (cachedAlert && lastFetchTime && (now - lastFetchTime) < CACHE_DURATION_MS) {
      return res.status(200).json({
        success: true,
        data: cachedAlert,
        cached: true,
        timestamp: lastFetchTime
      });
    }

    const rawAlert = await splunkService.fetchLatestAlert();
    
    if (!rawAlert) {
      return res.status(200).json({
        success: true,
        data: null,
        message: 'No alerts found'
      });
    }

    const normalizedAlert = normalizeSplunkAlert(rawAlert);
    
    cachedAlert = normalizedAlert;
    lastFetchTime = now;

    res.status(200).json({
      success: true,
      data: normalizedAlert,
      cached: false,
      timestamp: now
    });
  } catch (error) {
    console.error('[AlertController] Error fetching latest alert:', error);
    
    if (cachedAlert) {
      return res.status(200).json({
        success: true,
        data: cachedAlert,
        cached: true,
        timestamp: lastFetchTime,
        error: 'Using cached data due to fetch error'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch latest alert',
      message: error.message
    });
  }
};

exports.refreshAlert = async (req, res) => {
  try {
    cachedAlert = null;
    lastFetchTime = null;
    
    const rawAlert = await splunkService.fetchLatestAlert();
    
    if (!rawAlert) {
      return res.status(200).json({
        success: true,
        data: null,
        message: 'No alerts found'
      });
    }

    const normalizedAlert = normalizeSplunkAlert(rawAlert);
    
    cachedAlert = normalizedAlert;
    lastFetchTime = Date.now();

    res.status(200).json({
      success: true,
      data: normalizedAlert,
      timestamp: lastFetchTime
    });
  } catch (error) {
    console.error('[AlertController] Error refreshing alert:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to refresh alert',
      message: error.message
    });
  }
};

exports.getAlertStatus = async (req, res) => {
  try {
    const isConfigured = splunkService.isConfigured;
    
    res.status(200).json({
      success: true,
      data: {
        configured: isConfigured,
        cached: !!cachedAlert,
        lastFetch: lastFetchTime,
        demoMode: !isConfigured
      }
    });
  } catch (error) {
    console.error('[AlertController] Error getting alert status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get alert status'
    });
  }
};
