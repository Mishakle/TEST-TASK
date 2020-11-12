--\c into testtask

CREATE TABLE user_posts (
    id serial PRIMARY KEY,
    user_id INT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    published_date DATE NOT NULL
);

CREATE TABLE users (
    id serial PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL
);