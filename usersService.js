const express = require('express');
const fs = require('fs').promises;
// const config = require('./env/env');

const usersService = express.Router();
const usersDataFilePath = 'usersData.json';

usersService.use(express.json());

usersService.post('/api/checkPassword', (req, res) => {
  const { password } = req.body;
  const expectedPassword = '111111';

  if (password === expectedPassword) {
    return res.status(200).json({ success: true });
  } else {
    return res.status(401).json({ success: false, message: 'Неправильний пароль' });
  }
});

// Endpoint для перевірки пароля
usersService.post('/api/login', async (req, res) => {
  const { password } = req.body;

  try {
    const data = await fs.readFile(usersDataFilePath, 'utf8');
    const users = JSON.parse(data);

    const user = users.find(user => user.password === password);

    if (process.env.MAIN_PASSWORD === password) {
      res.json({
        success: true,
        position: process.env.STATUS,
      });
    } else if (user) {
      res.json({
        success: true,
        position: user.position,
        password: user.password,
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'Incorrect password',
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

// Endpoint для отримання всіх користувачів
usersService.get('/api/users', async (req, res) => {
  try {
    const data = await fs.readFile(usersDataFilePath, 'utf8');
    const users = JSON.parse(data);

    // const usersExceptFirst = users.slice(1);

    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

// Endpoint для отримання конкретного користувача
usersService.get('/api/users/:id', async (req, res) => {
  const userId = req.params.id;

  try {
    const data = await fs.readFile(usersDataFilePath, 'utf8');
    const users = JSON.parse(data);
    const user = users.find(user => user.id === userId);

    if (user) {
      res.json(user);
    } else {
      res.status(404).send('User not found');
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

// Генератор випадкових паролів
const generateRandomPassword = (length) => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let randomPassword = '';

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    randomPassword += characters.charAt(randomIndex);
  }

  return randomPassword;
};

// Перевіряє, чи пароль є унікальним в масиві користувачів
const isUniquePassword = (users, password) => {
  return users.every(user => user.password !== password);
};

// Endpoint для створення нового користувача
usersService.post('/api/users', async (req, res) => {
  const { name, surname, position } = req.body;

  try {
    const data = await fs.readFile(usersDataFilePath, 'utf8');
    const users = JSON.parse(data);

    let uniquePassword;
    do {
      uniquePassword = generateRandomPassword(6);
    } while (!isUniquePassword(users, uniquePassword));

    const newUser = {
      id: Date.now().toString(),
      name,
      surname,
      position,
      password: uniquePassword,
    };

    users.push(newUser);

    await fs.writeFile(usersDataFilePath, JSON.stringify(users, null, 2), 'utf8');
    res.json(newUser);
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});


// Endpoint для видалення користувача
usersService.delete('/api/users/:id', async (req, res) => {
  const userId = req.params.id;

  try {
    const data = await fs.readFile(usersDataFilePath, 'utf8');
    let users = JSON.parse(data);

    const index = users.findIndex(user => user.id === userId);

    if (index !== -1) {
      const deletedUser = users.splice(index, 1)[0];

      await fs.writeFile(usersDataFilePath, JSON.stringify(users, null, 2), 'utf8');
      res.json(deletedUser);
    } else {
      res.status(404).send('User not found');
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});


module.exports = usersService;
