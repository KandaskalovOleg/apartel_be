const express = require('express');
const cors = require('cors');

const itemsService = require('./itemsService');
const usersService = require('./usersService');
const positionsService = require('./positionsService');
const answerService = require('./answerService');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;
const IP = process.env.NODE_IP || '127.0.0.1';

app.use(cors());
app.use(express.json());

app.use(itemsService);
app.use(usersService);
app.use(positionsService);
app.use(answerService);
app.use('/images', express.static(path.join(__dirname, 'images')));

app.listen(PORT, IP, () => {
  console.log(`Server is running on port ${PORT}`);
});
