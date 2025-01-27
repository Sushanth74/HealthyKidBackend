const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root', // Replace with your MySQL username
  password: '', // Replace with your MySQL password
  database: 'HealthyApp',
  port:3306,
});

db.connect((err) => {
  if (err) 
    throw err;
  console.log('Connected to MySQL database');
});

module.exports = db;
