const express = require('express');
const cors = require('cors');

const itemsService = require('./itemsService');
const usersService = require('./usersService');
const positionsService = require('./positionsService');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cors());

app.use(itemsService);
app.use(usersService);
app.use(positionsService);


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});