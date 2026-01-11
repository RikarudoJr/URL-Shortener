# URL Shortener API

A simple URL shortener with **authentication**.  
Users can **sign up**, **log in**, **create shortened URLs**, **list their own URLs**, and **redirect** using a `shortCode`.

---

## Features

- ✅ User authentication (Signup / Login)
- ✅ Create a short URL from a long URL
- ✅ List all short URLs created by the logged-in user
- ✅ Redirect to the original URL via `shortCode`

---

## API Endpoints

### Auth

#### `POST /login` — Authenticate user and create a session
Create a new user account.

**Request body**
```json
{
  "email": "user@example.com",
  "password": "yourPassword123"
}
```
**Response**
* send cookie Header toward client's browser
```vbnet
Set-Cookie: sessionId=abc123xyz; HttpOnly; Secure; SameSite=Strict
```
* Http response
```json
{
  "message": "Login successful"
}
```

`POST /signup` — Create a new user account

`GET /` — Health check / API status

`POST /shorten` — Create a new shortened URL

`GET /urls` — Get all shortened URLs created by the logged-in user

`GET /:shortCode` — Redirect to the original long URL
