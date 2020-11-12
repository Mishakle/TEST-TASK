require('dotenv').config();

const express = require('express');
const app = express();
const pool = require('./db');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const emailValidation = require('./validation/emailValidation.js');
const passwordValidation = require('./validation/passwordValidation.js');
const authenticateToken = require('./authenticateToken/authenticateToken.js');

app.use(bodyParser.json());

// ROUTES

// GET ALL POSTS
app.get('/posts', async (req, res, next) => {
    try {
        const { min, max } = req.body;
        const allUserPosts = await pool.query('SELECT * FROM user_posts');
        const result = allUserPosts.rows.slice(Number(min-1), Number(max));
        res.json(result);
    } catch {
        res.status(500).send();
    }
})

// CREATE POST
app.post('/post', authenticateToken, async (req, res, next) => {
    try {
        const { title, content } = req.body;
        const joined = new Date();
        const newPost = await pool.query(
            'INSERT INTO user_posts (title, content, published_date, user_id) VALUES ($1, $2, $3, $4) RETURNING *',
            ([title, content, joined, req.user.id])
        );
        res.json(newPost.rows[0]);
    } catch {
        res.status(500).send();
    }
})

// UPDATE POST
app.put('/post/:id', authenticateToken, async (req, res, next) => {
    try {
        const { id } = req.params;
        const { title, content } = req.body;
        const targetPost = await pool.query(
            'SELECT * FROM user_posts WHERE user_id = $1 AND id = $2',
            [req.user.id, id]
        );
        if (targetPost.rows.length === 0) {
            return res.status(404).send('post is not found');
        }
        const updatePost = await pool.query(
            'UPDATE user_posts SET title = $1, content = $2 WHERE id = $3',
            [title, content, id]
        );
        res.json('post was updated');
    } catch {
        res.status(500).send();
    }
})

// GET POST
app.get('/post/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const post = await pool.query('SELECT * FROM user_posts WHERE id = $1', [id]);
        res.json(post.rows[0]);
    } catch {
        res.status(500).send();
    }
})

// DELETE POST
app.delete('/post/:id', authenticateToken, async (req, res, next) => {
    try {
        const { id } = req.params;
        const targetPost = await pool.query(
            'SELECT * FROM user_posts WHERE user_id = $1 AND id = $2',
            [req.user.id, id]
        );
        if (targetPost.rows.length === 0) {
            return res.status(404).send('post is not found');
        }
        const deletePost = await pool.query(
            'DELETE FROM user_posts WHERE id = $1', [id]
        );
        res.json('post was deleted');
    } catch {
        res.status(500).send();
    }
})

// GET POST BY USER ID
app.get('/user/posts/:id', authenticateToken, async (req, res, next) => {
    try {
        const { id } = req.params;
        const userPosts = await pool.query('SELECT * FROM user_posts WHERE user_id = $1', [id]);
        res.json(userPosts.rows);
    } catch {
        res.status(500).send();
    }
})

// GET DAILY POST STATS
app.get('/posts/stats', async (req, res, next) => {
    try {
        const { date } = req.body;
        const dailyPosts = await pool.query('SELECT * FROM user_posts WHERE published_date = $1', [date]);
        res.json(`Amount of posts for your chosed date is ${dailyPosts.rows.length}`);
    } catch {
        res.status(500).send(); 
    }
})

// REGISTER NEW USER
app.post('/register', async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!emailValidation(email)) {
            return res.json('Email is invalid');
        }
        if (!passwordValidation(password)) {
            return res.json('Password is invalid');
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await pool.query(
            'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING *',
            ([email, hashedPassword])
        );
        res.json('user was successfully added');
    } catch {
        res.status(500).send();
    }
})

app.post('/login', async (req, res, next) => {
    const { email, password } = req.body;
    const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (user.rows.length === 0) {
        return res.status(400).send('Cannot find user');
    }
    try {
        if (await bcrypt.compare(password, user.rows[0].password)) {
            const accessToken = jwt.sign(user.rows[0], process.env.ACCESS_TOKEN_SECRET, { algorithm: 'HS256', expiresIn: '1200s'});
            res.json({ accessToken: accessToken });
        } else {
            // rewrite it according to standarts
            res.send('Email or password is incorrect');
        }
    } catch {
        res.status(404).send('User does not exist');
    }
})

// UPDATING USER PROFILE INFORMATION
app.put('/user', authenticateToken, async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await pool.query(
            'UPDATE users SET email = $1, password = $2 WHERE id = $3',
            [email, hashedPassword, req.user.id]
        );
        res.json('user information was updated');
    } catch {
        res.status(500).send();
    }
})

// SEACRH POSTS USING TITLE AND CONTENT
app.get('/search', async (req, res, next) => {
    try {
        const { searchString } = req.body;
        const lowerCaseSearchString = searchString.toLowerCase();
        const postsArray = await pool.query('SELECT * FROM user_posts');
        let resultList = [];
        for (const item of postsArray.rows) {
            if (item.title.toLowerCase().includes(lowerCaseSearchString) || item.content.toLowerCase().includes(lowerCaseSearchString)) {
                resultList.push(item);
            }
        }
        res.json(resultList);
    } catch {
        res.status(500).send();
    }
})

app.listen(3000, () => {
    console.log('server is running on port 3000');
})