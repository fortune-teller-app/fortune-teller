require('dotenv').config();

const app = require('./app');
const { verifyRevocationStore } = require('./services/authService');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);

  // Surfaces a missing revocation table here rather than as a 500 on every
  // authenticated request.
  verifyRevocationStore();
});
