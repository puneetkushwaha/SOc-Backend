const { Playbook } = require('../models');

const getPlaybooks = async (req, res) => {
  try {
    const { category, severity, search } = req.query;

    const query = { is_active: true };

    if (category) {
      query.category = category;
    }

    if (severity) {
      query.severity = severity;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const playbooks = await Playbook.find(query).sort({ name: 1 });

    res.json({
      success: true,
      count: playbooks.length,
      data: playbooks
    });
  } catch (error) {
    console.error('Error fetching playbooks:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch playbooks'
    });
  }
};

const getPlaybookById = async (req, res) => {
  try {
    const { id } = req.params;

    const playbook = await Playbook.findOne({ id });

    if (!playbook) {
      return res.status(404).json({
        success: false,
        error: 'Playbook not found'
      });
    }

    res.json({
      success: true,
      data: playbook
    });
  } catch (error) {
    console.error('Error fetching playbook:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch playbook'
    });
  }
};

const createPlaybook = async (req, res) => {
  try {
    const playbookData = req.body;

    const count = await Playbook.countDocuments() + 1;
    playbookData.id = `PB-${(1000 + count).toString()}`;

    if (!playbookData.last_updated) {
      playbookData.last_updated = new Date();
    }

    const playbook = new Playbook(playbookData);
    await playbook.save();

    res.status(201).json({
      success: true,
      data: playbook
    });
  } catch (error) {
    console.error('Error creating playbook:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create playbook'
    });
  }
};

const updatePlaybook = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    updates.last_updated = new Date();

    const playbook = await Playbook.findOneAndUpdate(
      { id },
      updates,
      { new: true, runValidators: true }
    );

    if (!playbook) {
      return res.status(404).json({
        success: false,
        error: 'Playbook not found'
      });
    }

    res.json({
      success: true,
      data: playbook
    });
  } catch (error) {
    console.error('Error updating playbook:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update playbook'
    });
  }
};

module.exports = {
  getPlaybooks,
  getPlaybookById,
  createPlaybook,
  updatePlaybook
};
