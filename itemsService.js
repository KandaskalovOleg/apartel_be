// itemsService.js
const express = require('express');
const fs = require('fs').promises;

const itemsService = express.Router();
const dataFilePath = 'data.json';

itemsService.use(express.json());

// Endpoint для отримання всіх елементів
itemsService.get('/api/items', async (req, res) => {
  try {
    const data = await fs.readFile(dataFilePath, 'utf8');
    const items = JSON.parse(data);
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

// Інші ендпоінти для роботи з елементами (оновлення, видалення), аналогічні до usersService.js

module.exports = itemsService;
