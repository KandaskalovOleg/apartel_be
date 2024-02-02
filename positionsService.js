const express = require('express');
const fs = require('fs').promises;

const positionsService = express.Router();
const positionsDataFilePath = 'positionList.json';

positionsService.use(express.json());

// Endpoint для отримання всіх позицій
positionsService.get('/api/positions', async (req, res) => {
  try {
    const data = await fs.readFile(positionsDataFilePath, 'utf8');
    const positions = JSON.parse(data);
    res.json(positions);
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

// Endpoint для додавання нової позиції
positionsService.post('/api/positions', async (req, res) => {
  const newPosition = req.body;

  try {
    const data = await fs.readFile(positionsDataFilePath, 'utf8');
    const positions = JSON.parse(data);

    if (positions.some(position => position.name === newPosition.name)) {
      res.status(400).send('Position with the same name already exists');
    } else {
      const newId = positions.length > 0 ? String(Math.max(...positions.map(pos => +pos.id)) + 1) : '1';

      const newPositionWithPool = { id: newId, ...newPosition, pool: [] };

      positions.push(newPositionWithPool);
      await fs.writeFile(positionsDataFilePath, JSON.stringify(positions, null, 2), 'utf8');
      res.json(newPositionWithPool);
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

// Endpoint для оновлення позиції
positionsService.put('/api/positions/:id', async (req, res) => {
  const positionId = req.params.id;
  const updatedPosition = req.body;

  try {
    const data = await fs.readFile(positionsDataFilePath, 'utf8');
    let positions = JSON.parse(data);

    const index = positions.findIndex(position => position.id === positionId);

    if (index !== -1) {
      positions[index] = { ...positions[index], ...updatedPosition };
      await fs.writeFile(positionsDataFilePath, JSON.stringify(positions, null, 2), 'utf8');
      res.json(positions[index]);
    } else {
      res.status(404).send('Position not found');
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

// Endpoint для видалення позиції
positionsService.delete('/api/positions/:id', async (req, res) => {
  const positionId = req.params.id;

  try {
    const data = await fs.readFile(positionsDataFilePath, 'utf8');
    let positions = JSON.parse(data);

    const index = positions.findIndex(position => position.id === positionId);

    if (index !== -1) {
      const deletedPosition = positions.splice(index, 1)[0];
      await fs.writeFile(positionsDataFilePath, JSON.stringify(positions, null, 2), 'utf8');
      res.json(deletedPosition);
    } else {
      res.status(404).send('Position not found');
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

positionsService.post('/api/questions/:positionId', async (req, res) => {
  const { positionId } = req.params;
  const newQuestion = req.body;

  try {
    const data = await fs.readFile(positionsDataFilePath, 'utf8');
    const positions = JSON.parse(data);

    const positionIndex = positions.findIndex((pos) => pos.id === positionId);

    if (positionIndex !== -1) {
      positions[positionIndex].pool.push(newQuestion);
      await fs.writeFile(positionsDataFilePath, JSON.stringify(positions, null, 2), 'utf8');
      res.json(newQuestion);
    } else {
      res.status(404).send('Посада не знайдена');
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Внутрішня помилка сервера');
  }
});

positionsService.delete('/api/questions/:positionIndex/:questionIndex', async (req, res) => {
  const { positionIndex, questionIndex } = req.params;
  

  try {
    const data = await fs.readFile(positionsDataFilePath, 'utf8');
    let positions = JSON.parse(data);

    // Перевіряємо, чи індекси є числами
    if (isNaN(positionIndex) || isNaN(questionIndex)) {
      return res.status(400).send('Невірні індекси');
    }

    const positionIndexNum = parseInt(positionIndex);
    const questionIndexNum = parseInt(questionIndex);


    if (positionIndexNum < 0 || positionIndexNum > positions.length) {
      return res.status(404).send('Посада не знайдена');
    }

    const position = positions[positionIndexNum - 1];

    if (questionIndexNum < 0 || questionIndexNum >= position.pool.length) {
      return res.status(404).send('Питання не знайдено');
    }

    const deletedQuestion = position.pool.splice(questionIndexNum, 1)[0];
    console.log(deletedQuestion);
    
    await fs.writeFile(positionsDataFilePath, JSON.stringify(positions, null, 2), 'utf8');
    
    res.json(deletedQuestion);
  } catch (err) {
    console.error(err);
    res.status(500).send('Внутрішня помилка сервера');
  }
});

positionsService.get('/api/positions/:name/questions', async (req, res) => {
  const { name } = req.params;
  const decodedName = decodeURIComponent(name);

  try {
    const data = await fs.readFile(positionsDataFilePath, 'utf8');
    const positionList = JSON.parse(data);

    const position = positionList.find(pos => pos.name === decodedName );

    if (!position) {
      return res.status(404).json({ error: 'Position not found' });
    }

    const questionsData = position.pool.map(({ type, question, link, options }) => ({
      type,
      question,
      link,
      options: Object.keys(options),
    }));

    res.json(questionsData);
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});


module.exports = positionsService;