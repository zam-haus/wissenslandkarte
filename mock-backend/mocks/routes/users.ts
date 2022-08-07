import { CURRENT_USER, updateCurrentUser, USERS } from '../fakeData/store';
import { makeRandomFakeUserDTO } from '../fakeData/userGenerators';
import type { RouteExport } from '../mocks';
import { CurrentUserDTO, UserDTO } from '../models/user';

export default <RouteExport>[
  {
    id: 'get-logged-in-user',
    url: '/api/users/me',
    method: 'GET',
    variants: [
      {
        id: 'success',
        response: {
          status: 200,
          body: CURRENT_USER,
        },
      },
      {
        id: 'not-logged-in',
        response: {
          status: 401,
          body: { message: 'Not logged in, cannot return current user', messageId: 'not-authorized' },
        },
      },
    ],
  },
  {
    id: 'edit-logged-in-user',
    url: '/api/users/me',
    method: 'POST',
    variants: [
      {
        id: 'success',
        response: (req, res) => {
          updateCurrentUser(req.params as unknown as CurrentUserDTO);
          res.status(200).send(CURRENT_USER);
        },
      },
      {
        id: 'not-logged-in',
        response: {
          status: 401,
          body: { message: 'Not authorized to edit this user', messageId: 'not-authorized' },
        },
      },
    ],
  },
  {
    id: 'get-all-users',
    url: '/api/users',
    method: 'GET',
    variants: [
      {
        id: 'success',
        response: {
          status: 200,
          body: USERS,
        },
      }, {
        id: 'error',
        response: {
          status: 400,
          body: { message: 'Unspecified error occurred', messageId: 'unspecified-error' },
        },
      },
    ],
  },
  {
    id: 'get-user',
    url: '/api/users/:id',
    method: 'GET',
    variants: [
      {
        id: 'real',
        response: (req, res) => {
          const userId = req.params.id;
          const user = USERS.find((userData) => userData.id === Number(userId));
          if (user) {
            res.status(200);
            res.send(user);
          } else {
            res.status(404);
            res.send({
              message: 'User not found', messageId: 'not-found',
            });
          }
        },
      },
      {
        id: 'random',
        response: (req, res) => res.status(200).send(makeRandomFakeUserDTO(Number(req.params.id))),
      },
      {
        id: 'does-not-exist',
        response: {
          status: 404,
          text: 'Does not exist',
        },
      },
      {
        id: 'server-error',
        response: {
          status: 500,
          text: 'Server error',
        },
      },
    ],
  },
  {
    id: 'admin-update-user',
    url: '/api/users/:id',
    method: 'POST',
    variants: [
      {
        id: 'unauthorized',
        response: {
          status: 401,
          body: { message: 'Not authorized to edit this user', messageId: 'not-authorized' },
        },
      },
      {
        id: 'bad request',
        response: {
          status: 400,
          body: { message: 'Bad request: Missing something', messageId: 'bad-request' },
        },
      },
      {
        id: 'real',
        response: (req, res) => {
          const userId = Number(req.params.id);
          const user = USERS.findIndex((userData) => userData.id === userId);
          if (user) {
            USERS[userId] = req.params as unknown as UserDTO;
            res.status(200);
            res.send(user);
          } else {
            res.status(404);
            res.send({
              message: 'User not found',
            });
          }
        },
      },
    ],
  },
];
