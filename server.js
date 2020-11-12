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
        const page = Number(req.query.page);
        let perPage = Number(req.query.per_page);
        if (!page) {
            page = 1;
        }
        if (!perPage) {
            perPage = 25;
        }
        if (!Number.isInteger(page) || page < 1) {
            return res.status(422).send('"page" must be a positive integer');
        }
        if (!Number.isInteger(perPage) || perPage < 1) {
            return res.status(422).send('"perPage" must be a positive integer');
        }
        const allUserPosts = await pool.query(`
            SELECT * FROM user_posts LIMIT ${perPage} OFFSET ${(page - 1) * perPage};
        `);
        res.json(allUserPosts.rows);
    } catch (error) {
        console.error(error);
        res.sendStatus(500);
    }
})

// CREATE POST
app.post('/posts', authenticateToken, async (req, res, next) => {
    try {
        const { title, content } = req.body;
        const publishedDate = new Date();
        const newPost = await pool.query(
            'INSERT INTO user_posts (title, content, published_date, user_id) VALUES ($1, $2, $3, $4) RETURNING *',
            ([title, content, publishedDate, req.user.id])
        );
        res.json(newPost.rows[0]);
    } catch (error) {
        console.error(error);
        res.sendStatus(500);
    }
})

// GET DAILY POST STATS
app.get('/posts/stats', async (req, res, next) => {
    try {
        const { date } = req.body;
        const result = await pool.query('SELECT COUNT(*) as count FROM user_posts WHERE published_date = $1', [date]);
        const count = result.rows[0].count;
        res.json({ result: count });
    } catch (error) {
        console.error(error);
        res.sendStatus(500);
     }
})

// UPDATE POST
app.put('/posts/:id', authenticateToken, async (req, res, next) => {
    try {
        const { id } = req.params;
        const { title, content } = req.body;
        const { rows } = await pool.query(`
            UPDATE user_posts SET title = $1, content = $2 WHERE id = $3 AND user_id = $4 RETURNING *;`, 
            [title, content, id, req.user.id]
        );
        if (rows.length === 0) {
            res.sendStatus(404);
        }
        res.send('post was updated');
    } catch (error) {
        console.error(error);
        res.sendStatus(500);
    }
})

// GET POST
app.get('/posts/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const post = await pool.query('SELECT * FROM user_posts WHERE id = $1', [id]);
        res.json(post.rows[0]);
    } catch (error) {
        console.error(error);
        res.sendStatus(500);
    }
})

// DELETE POST
app.delete('/posts/:id', authenticateToken, async (req, res, next) => {
    try {
        const { id } = req.params;
        const { rows } = await pool.query(
            'DELETE FROM user_posts WHERE id = $1 AND user_id = $2 RETURNING *;', [id, req.user.id]
        );
        if (rows.length === 0) {
            res.sendStatus(404);
        } else {
            res.sendStatus(204);
        }
    } catch (error) {
        console.error(error);
        res.sendStatus(500);
    }
})



// GET POST BY USER ID
app.get('/user/posts/:id', authenticateToken, async (req, res, next) => {
    try {
        const { id } = req.params;
        const userPosts = await pool.query('SELECT * FROM user_posts WHERE user_id = $1', [id]);
        res.json(userPosts.rows);
    } catch (error) {
        console.error(error);
        res.sendStatus(500);
    }
})


// REGISTER NEW USER
app.post('/register', async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!emailValidation(email)) {
            return res.status(422).send('Email is invalid');
        }
        if (!passwordValidation(password)) {
            return res.status(422).send('Password is invalid');
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query(
            'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING *',
            ([email, hashedPassword])
        );
        res.json('user was successfully added');
    } catch (error) {
        console.error(error);
        res.sendStatus(500);
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
            res.json({ accessToken });
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
        await pool.query(
            'UPDATE users SET email = $1, password = $2 WHERE id = $3',
            [email, hashedPassword, req.user.id]
        );
        res.json('user information was updated');
    } catch (error) {
        console.error(error);
        res.sendStatus(500);
    }
})

// SEACRH POSTS USING TITLE AND CONTENT
app.get('/search', async (req, res, next) => {
    try {
        const { searchString } = req.body;
        const { rows } = await pool.query(
            `SELECT * FROM user_posts WHERE title ILIKE $1 OR content ILIKE $1`, [`%${searchString}%`]
        );
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.sendStatus(500);
    }
})

app.listen(3000, () => {
    console.log('server is running on port 3000');
})