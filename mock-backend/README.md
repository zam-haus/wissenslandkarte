# Backend mock for Wissenslandkarte

This mocks a simple backend for the Wissenslandkarte project
that can be used to develop the UI before finalizing the API.

## Endpoints

If you need a different API endpoint, feel free to adapt it and
open a MR. At the moment there are the following endpoints -- for their
payloads check the corresponding models in the models folder.

1. Users
GET: `/api/users/`, `/api/users/:id`, `/api/users/me`
POST when logged in: `api/users/me`
POST when logged in as admin: `api/users/:id`

2. Projects
GET: `/api/projects/`, `/api/projects?view=short`, `/api/projects/:id`
POST when logged in as an owner of a project or admin: `/api/projects/:id`

## Installation and running 

```
npm install
npm start
```

This mock backend utilizes https://mocks-server.org . To change
the behavior of an endpoint, choose a different variant for the 
corresponding endpoint. 
