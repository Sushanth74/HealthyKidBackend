const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const router = express.Router();

// User Registration
router.post('/register', async (req, res) => {
  
    const { username, email, password } = req.body;

    // Validate request body
    if (!username || !email || !password) {
      console.error('Validation Error: Missing fields');
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Hash the password
    const hashedPassword =  await bcrypt.hash(password, 10);

    // Insert into database
    const sql = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
    console.log(sql)
    db.query(sql, [username, email, hashedPassword], (err, result) => {
      if (err) {
        console.error('Database Error:', err);
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(400).json({ error: 'Email already exists' });
        }
        return res.status(500).json({ error: 'Database query failed' });
      }
      
      res.status(201).json({ message: 'User registered successfully',user: { id: result.insertId, username: username, email: email, age: "", gender: "" } });
    });
  
});


// User Login
router.post('/login', (req, res) => {
  const {email, password } = req.body;
  console.log('HERE:', email,password)
  const sql = 'SELECT * FROM users WHERE email = ?';
  db.query(sql, [email], async (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (results.length === 0) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const user = results[0];
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    return res.status(200).json({ message: 'Login successful', user: { id: user.UserID, username: user.username, email: user.email, age: user.Age, gender: user.Gender } });
  });
});


// Forgot Password
router.post('/forgot-password', (req, res) => {
  const { email } = req.body;
  const sql = 'SELECT * FROM users WHERE email = ?';
  db.query(sql, [email], (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (results.length === 0) return res.status(400).json({ error: 'Email not found' });

    const token = crypto.randomBytes(32).toString('hex');
    const expiration = Date.now() + 3600000;

    const tokenSql = 'UPDATE users SET reset_token = ?, reset_token_expiration = ? WHERE email = ?';
    db.query(tokenSql, [token, expiration, email], (err) => {
      if (err) return res.status(500).json({ error: 'Database error' });

      // Simulate sending email
      console.log(`Password reset link: http://yourfrontend.com/reset-password?token=${token}`);
      res.status(200).json({ message: 'Password reset link sent to email', token });
    });
  });
});

// Reset Password
router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;

  const sql = 'SELECT email FROM users WHERE reset_token = ? AND reset_token_expiration > ?';
  db.query(sql, [token, Date.now()], async (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (results.length === 0) return res.status(400).json({ error: 'Invalid or expired token' });

    const email = results[0].email;
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const updateSql = 'UPDATE users SET password = ?, reset_token = NULL, reset_token_expiration = NULL WHERE email = ?';
    db.query(updateSql, [hashedPassword, email], (err) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      res.status(200).json({ message: 'Password reset successful' });
    });
  });
});

router.post('/updateprofile',async(req,res)=>{
  const {UserID,age,gender}=req.body;
  const sql='UPDATE users SET Age = ?, Gender = ? WHERE UserID = ?'
  db.query(sql,[age,gender,UserID],(err,results)=>{
    console.log(results);
    
    if(err) return res.status(500).json({error:'Database error'})
      res.status(200).json({message:'Profile updated successfully'})
    })
})

//Adding scores to DB
router.post('/insertScores', async (req, res) => {
  const { General_Health_Score, ENT_Score, Vision_score, Oral_score, physical_health_score, mentalWellnessScore, OverallScore, UserID } = req.body;
  console.log('BODY:',req.body)

    // Get the current date
  const currentDate = new Date();
  
  // const existSql = 'SELECT * FROM users WHERE UserID = ?';
  // db.query(existSql, [parseInt(UserID)], async (err, results) => {
  //   if (err) return res.status(500).json({ error: 'Database error' });
  //   if (results.length === 0) {
      const sql = 'INSERT INTO Scores (Date, General_Health_Score, ENT_Score, Vision_score, Oral_score, Physical_score, Mental_Wellness_Score, Overall_score, UserID) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
      console.log(sql)
      db.query(sql, [currentDate, General_Health_Score, ENT_Score, Vision_score, Oral_score, physical_health_score, mentalWellnessScore, OverallScore, parseInt(UserID)], (err, result) => {
        if (err) {
          console.log('ERR:',err)
          if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Email already exists' });
          }
          return res.status(500).json({ error: 'Database error' });
        }
        return res.status(201).json({ message: 'Scores added successfully' });
      });
    // }
    // else{
    //   const sql = 'UPDATE Scores SET General_Health_Score = ?, ENT_Score = ?, Vision_score = ?, Oral_score = ?, Physical_score = ?, Mental_Wellness_Score = ?, Overall_score = ? WHERE UserID = ?'
    //   db.query(sql, [General_Health_Score, ENT_Score, Vision_score, Oral_score, physical_health_score, mentalWellnessScore, OverallScore, parseInt(UserID)], (err) => {
    //   if (err) return res.status(500).json({ error: 'Database error' });
    //   res.status(200).json({ message: 'Scores updated successfully' });
    // });
    // }
  // })

  
});


// Get User Scores
router.get('/getScores', (req, res) => {
  const UserID = req.query.UserID; // Assuming userID is passed as a query parameter
  console.log('UserID:',UserID)
  if (!UserID) {
    return res.status(400).json({ error: 'UserID is required' });
  }

  // SQL query to fetch the scores for the given userID
  const query = 'SELECT * FROM Scores WHERE UserID = ? ORDER BY ScoresID DESC';
  db.query(query, [parseInt(UserID)], (err, results) => {
    if (err) {
      console.error('Error fetching scores:', err);
      return res.status(500).json({ error: 'Error fetching scores from the database' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'No scores found for this user' });
    }

    // Send the results (scores) as the response
    res.status(200).json({
      scores: results,
    });
  });
});

module.exports = router;
