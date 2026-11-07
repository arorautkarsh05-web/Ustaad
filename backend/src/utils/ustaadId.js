const pool = require('../config/database');

const generateUstaadId = async (state) => {
  const stateCode = getStateCode(state);
  const [rows] = await pool.query(
    'SELECT COUNT(*) as count FROM mechanic_profiles WHERE ustaad_id LIKE ?',
    [`UE-${stateCode}-%`]
  );
  const count = rows[0].count + 1;
  return `UE-${stateCode}-${String(count).padStart(5, '0')}`;
};

const getStateCode = (state) => {
  const codes = {
    'Maharashtra': 'MH', 'Delhi': 'DL', 'Karnataka': 'KA', 'Tamil Nadu': 'TN',
    'Gujarat': 'GJ', 'Rajasthan': 'RJ', 'Uttar Pradesh': 'UP', 'West Bengal': 'WB',
    'Andhra Pradesh': 'AP', 'Telangana': 'TS', 'Kerala': 'KL', 'Punjab': 'PB',
    'Haryana': 'HR', 'Madhya Pradesh': 'MP', 'Bihar': 'BR', 'Odisha': 'OD',
  };
  return codes[state] || 'XX';
};

module.exports = { generateUstaadId };

