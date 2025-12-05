# Vybe / ASTRIX - Social Media Application

A full-featured social media platform built with the MERN stack (MongoDB, Express, React, Node.js).

## 🚀 Live Links

- **Frontend:** [https://social-media-h8qp.vercel.app/](https://social-media-h8qp.vercel.app/)
- **Backend:** [https://social-media-eviq.onrender.com](https://social-media-eviq.onrender.com)

## 📡 API Endpoints

### Authentication (`/api/auth`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/signup` | Register a new user |
| POST | `/signin` | Log in user |
| GET | `/signout` | Log out user |

### User (`/api/user`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/me` | Get current logged-in user details |
| GET | `/search` | Search for users |
| GET | `/:id` | Get specific user profile by ID |
| PUT | `/follow/:id` | Follow/Unfollow a user |
| PUT | `/update-profile` | Update profile picture |
| PUT | `/update-details` | Update profile name, username, bio |

### Posts (`/api/post`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/create` | Create a new post |
| GET | `/feed` | Get news feed posts |
| PUT | `/like/:id` | Like/Unlike a post |
| DELETE | `/:id` | Delete a post |
| PUT | `/:id` | Update a post caption |
| POST | `/:id/comment` | Add a comment to a post |
| GET | `/:id/comments` | Get comments for a post |
| DELETE | `/:postId/comment/:commentId` | Delete a comment |

### Reels / Loops (`/api/loop`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/upload` | Upload a new reel (video) |
| GET | `/feed` | Get reels feed |
| PUT | `/like/:id` | Like/Unlike a reel |
| DELETE | `/:id` | Delete a reel |
| PUT | `/:id` | Update reel caption |
| POST | `/:id/comment` | Add comment to reel |
| GET | `/:id/comments` | Get reel comments |
| DELETE | `/:id/comment/:commentId` | Delete reel comment |

### Stories (`/api/story`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/create` | Create a new story (24h expiry) |
| GET | `/feed` | Get stories from followed users |
| DELETE | `/:id` | Delete a story |
| PUT | `/:id` | Update a story |
| PUT | `/:id/view` | Mark story as viewed |

### Chat (`/api/chat`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/send/:id` | Send a direct message to user ID |
| GET | `/conversations` | Get list of active conversations |
| GET | `/:id` | Get messages with a specific user |
| DELETE | `/message/:id` | Delete a message |
| PUT | `/message/:id` | Edit a message |
