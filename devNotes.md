https://prod.liveshare.vsengsaas.visualstudio.com/join?D88557289949A6E6C140DB635A015F1CE246

# Developer Notes

Find a way to manage friends. In a database either:
  The database holds every single person with a registered account and for each person, lists every friend <br>
  
  **Propsed Solution**: Join Table with Database
  ```
  CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL
  );
  
  CREATE TABLE friendships (
    user_id INT REFERENCES users(id),
    friend_id INT REFERENCES users(id),
    PRIMARY KEY (user_id, friend_id),
    CHECK (user_id <> friend_id) -- Prevent self-friendship
  );
  ```
