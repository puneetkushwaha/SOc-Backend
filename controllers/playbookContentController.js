const mammoth = require('mammoth');
const fs = require('fs');
const path = require('path');
const { getPlaybookFilePath, getPlaybookById } = require('../config/playbookFiles');

const getPlaybookContent = async (req, res) => {
  try {
    const { id } = req.params;

    const filePath = getPlaybookFilePath(id);
    
    if (!filePath) {
      return res.status(404).json({
        success: false,
        error: 'Playbook document not found'
      });
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: 'Playbook file not found on server'
      });
    }

    const result = await mammoth.convertToHtml({ path: filePath });
    const htmlContent = result.value;
    
    const playbookInfo = getPlaybookById(id);

    res.json({
      success: true,
      data: {
        id,
        name: playbookInfo?.name || id,
        slug: playbookInfo?.slug,
        content: htmlContent,
        rawContent: result.value,
        warnings: result.messages
      }
    });
  } catch (error) {
    console.error('Error reading playbook content:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to parse playbook document'
    });
  }
};

const downloadPlaybook = async (req, res) => {
  try {
    const { id } = req.params;

    const filePath = getPlaybookFilePath(id);
    
    if (!filePath) {
      return res.status(404).json({
        success: false,
        error: 'Playbook document not found'
      });
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: 'Playbook file not found on server'
      });
    }

    const playbookInfo = getPlaybookById(id);
    const fileName = playbookInfo?.fileName || `${id}.docx`;

    res.download(filePath, fileName, (err) => {
      if (err) {
        console.error('Error downloading file:', err);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            error: 'Failed to download playbook'
          });
        }
      }
    });
  } catch (error) {
    console.error('Error downloading playbook:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to download playbook'
    });
  }
};

module.exports = {
  getPlaybookContent,
  downloadPlaybook
};
