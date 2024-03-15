const express = require('express');
const fs = require('fs').promises;
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const path = require('path');
const mammoth = require('mammoth');


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

    if (positions.some(position => position.name.toUpperCase() === newPosition.name.toUpperCase())) {
      res.status(400).send('Position with the same name already exists');
    } else {
      const newId = positions.length > 0 ? String(Math.max(...positions.map(pos => +pos.id)) + 1) : '1';

      const newPositionWithPool = { id: newId, ...newPosition, pool: [], info: {} };

      positions.push(newPositionWithPool);
      await fs.writeFile(positionsDataFilePath, JSON.stringify(positions, null, 2), 'utf8');
      res.json(newPositionWithPool);
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

positionsService.post('/api/positions/:id/info', upload.single('doc'), async (req, res) => {
  const positionId = req.params.id;
  const originalFileName = req.file.originalname; // Оригінальне ім'я завантаженого файлу
  const fileExtension = path.extname(originalFileName); // Отримати розширення файлу

  try {
    const data = await fs.readFile(req.file.path);
    const result = await mammoth.convertToHtml({ buffer: data });
    const htmlContent = result.value; // Отримуємо HTML-контент

    const positionsData = await fs.readFile(positionsDataFilePath, 'utf8');
    const positions = JSON.parse(positionsData);

    const positionIndex = positions.findIndex(pos => pos.id === positionId);

    if (positionIndex !== -1) {
      const fileName = `${positionId}_${Date.now()}.html`;
      await fs.writeFile(path.join('uploads', fileName), htmlContent, 'utf8');
      positions[positionIndex].info = fileName;
      await fs.writeFile(positionsDataFilePath, JSON.stringify(positions, null, 2), 'utf8');
      res.json({ message: 'HTML-файл успішно збережено у полі info позиції' });
    } else {
      res.status(404).send('Позицію не знайдено');
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Внутрішня помилка сервера');
  }
});

// Ендпоінт для отримання файлу
positionsService.get('/api/positions/:positionId/file', async (req, res) => {
  const positionName = req.params.positionId;

  try {
    const data = await fs.readFile(positionsDataFilePath, 'utf8');
    const positions = JSON.parse(data);

    const position = positions.find(pos => pos.name === positionName);

    if (!position || !position.info) {
      return res.status(404).json({ error: 'Position file not found' });
    }

    // Побудова шляху до файлу відносно кореневого каталогу сервера
    const filePath = path.join(__dirname, 'uploads', position.info);

    // Відправлення HTML-файлу клієнту
    res.sendFile(filePath);
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

// Ендпоінт для отримання HTML-коду з властивості info позиції за ім'ям
positionsService.get('/api/positions/:positionId', async (req, res) => {
  const positionName = req.params.positionId;

  try {
    const data = await fs.readFile(positionsDataFilePath, 'utf8');
    const positions = JSON.parse(data);

    const position = positions.find(pos => pos.name === positionName);

    if (!position) {
      return res.status(404).json({ error: 'Position not found' });
    }

    res.json({ html: position.info });
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

positionsService.delete('/api/questions/:positionId/:questionIndex', async (req, res) => {
  const { positionId, questionIndex } = req.params;
  
  try {
    const data = await fs.readFile(positionsDataFilePath, 'utf8');
    let positions = JSON.parse(data);

    if (isNaN(questionIndex)) {
      return res.status(400).send('Невірний індекс');
    }

    const questionIndexNum = parseInt(questionIndex);

    const position = positions.find(pos => pos.id === positionId);

    if (!position) {
      return res.status(404).send('Посада не знайдена');
    }

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

    const questionsData = position.pool.map(({ type, question, link, options, image }) => ({
      type,
      question,
      link,
      options: Object.keys(options),
      image
    }));

    res.json(questionsData);
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});


module.exports = positionsService;