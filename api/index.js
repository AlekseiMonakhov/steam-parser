const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const coefficientsRoutes = require('./routes/coefficientsRoutes');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

app.use(bodyParser.json());
app.use(cors());

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

app.use('/api', coefficientsRoutes);

app.get('/', (req, res) => {
  res.status(200).send('API is running');
});

const PORT = process.env.PORT || 3008;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});
