const express = require('express');
const fs = require('fs').promises;

const answerService = express.Router();

answerService.use(express.json());

const positionsDataFilePath = 'positionList.json';
const usersDataFilePath = 'usersData.json';

answerService.post('/api/submitAnswers', async (req, res) => {
  try {
    const { password, answers } = req.body;

    // Отримуємо дані про користувачів з файлу
    const usersData = await fs.readFile(usersDataFilePath, 'utf8');
    const users = JSON.parse(usersData);

    // Знаходимо користувача за паролем
    const user = users.find(user => user.password === password);
    if (!user) {
      return res.status(404).json({ message: "Користувача з таким паролем не знайдено." });
    }

    // Перевіряємо чи вже є відповіді користувача
    if (!user.answer) {
      // Якщо немає, створюємо об'єкт з відповідями та зберігаємо його
      user.answer = {
        marks: [], // Масив оцінок
        results: [] // Масив результатів
      };
    }

    // Отримуємо поточні відповіді та додаємо новий об'єкт масиву
    const currentAnswers = {};
    for (const [questionIndex, options] of Object.entries(answers)) {
      const answer = {};
      for (const [optionIndex, value] of Object.entries(options)) {
        answer[optionIndex] = value;
      }
      currentAnswers[questionIndex] = answer;
    }
    user.answer.results.push(currentAnswers);

    // Отримуємо дані про позиції з файлу
    const positionsData = await fs.readFile(positionsDataFilePath, 'utf8');
    const positions = JSON.parse(positionsData);

    // Знаходимо позицію користувача
    const userPosition = positions.find(pos => pos.name === user.position);
    if (!userPosition) {
      return res.status(404).json({ message: "Позицію користувача не знайдено." });
    }

    // Обчислюємо марк для останньої відповіді
    let correctCount = 0;
    for (const [questionIndex, options] of Object.entries(answers)) {
      const questionIndexAsNumber = parseInt(questionIndex, 10);
      const question = userPosition.pool[questionIndexAsNumber];
      if (!question) continue;
    
      if (question.type === "radio" || question.type === "video-radio") {
        const selectedOptionIndex = parseInt(Object.keys(options)[0], 10);
        const selectedOption = Object.keys(question.options)[selectedOptionIndex];
        if (selectedOption && question.options[selectedOption]) correctCount++;
      } else if (question.type === "checked" || question.type === "video-checked") {
        const correctOptions = Object.entries(question.options)
          .map(([optionIndex, value], index) => ({ index, value })) // Створюємо об'єкти з порядковим номером та значенням
          .filter(({ value }) => value === true) // Фільтруємо тільки ті варіанти, де значення === true
          .map(({ index }) => index); // Отримуємо оригінальні порядкові номери варіантів

        const userOptions = Object.entries(options)
          .filter(([_, value]) => value) // Відфільтрувати пари ключ-значення, де значення === true
          .map(([optionIndex]) => parseInt(optionIndex, 10)); // Отримати ключі варіантів, обрані користувачем, перетворені у числовий тип

        // Перевірити, чи всі варіанти, обрані користувачем, співпадають з правильними варіантами
        if (correctOptions.length === userOptions.length && correctOptions.every(option => userOptions.includes(option))) {
          correctCount++;
        }
      }
    }
    
    const totalQuestions = userPosition.pool.length;
    const mark = `${correctCount}/${totalQuestions}`;
    user.answer.marks.push(mark);
    
    



    // Зберігаємо оновлені дані користувача у файлі
    await fs.writeFile(usersDataFilePath, JSON.stringify(users, null, 2));

    res.json({ message: "Відповіді успішно збережено." });
  } catch (error) {
    console.error('Помилка під час обробки відповідей:', error);
    res.status(500).json({ message: "Помилка під час обробки відповідей." });
  }
});

answerService.post('/api/marks', async (req, res) => {
  try {
    const { password } = req.body;

    // Отримуємо дані про користувачів з файлу
    const usersData = await fs.readFile(usersDataFilePath, 'utf8');
    const users = JSON.parse(usersData);

    // Здійснюємо пошук користувача за паролем
    const user = users.find(user => user.password === password);

    if (user) {
      // Якщо користувач знайдений, отримуємо його marks
      const userMarks = user.answer.marks;
      
      if (userMarks.length > 0) {
        // Якщо marks користувача є, повертаємо останній елемент
        const lastMark = userMarks[userMarks.length - 1];
        res.json(lastMark);
      } else {
        // Якщо marks порожній, повертаємо відповідний статус та повідомлення
        res.status(404).json({ message: 'Масив marks користувача порожній' });
      }
    } else {
      // Якщо користувач не знайдений, повертаємо відповідний статус та повідомлення
      res.status(404).json({ message: 'Користувача з таким паролем не знайдено' });
    }
  } catch (error) {
    console.error('Помилка під час отримання оцінок:', error);
    res.status(500).json({ message: "Помилка під час отримання оцінок." });
  }
});

module.exports = answerService;
