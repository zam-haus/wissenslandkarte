import { RouteExport } from '../mocks';
import { UserDTO, CurrentUserDTO } from '../models/user';
import { USERS, CURRENT, makeRandomFakeUserDTO, makeRandomFakeCurrentUserDTO, updateCurrentUser } from '../fakeData/users';


module.exports = <RouteExport>[
  {
    id: 'get-logged-in-user',
    url: '/api/users/me',
    method: 'GET',
    variants: [
      {
        id: 'success',
        type: 'json',
        options: {
          status: 200,
          body: CURRENT,
        },
      },
      {
        id: 'not-logged-in',
        type: 'json',
        options: {
          status: 401,
          body: { message: 'Not logged in, cannot return current user', messageId: 'not-authorized', }
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
        type: 'middleware',
        options: {
          middleware: (req, res) => {
            updateCurrentUser(req.params as unknown as CurrentUserDTO);
            res.status(200).send(CURRENT);
          }
        }
      },
      {
        id: 'not-logged-in',
        type: 'json',
        options: {
          status: 401,
          body: { message: 'Not authorized to edit this user', messageId: 'not-authorized', }
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
        type: 'json',
        options: {
          status: 200,
          body: USERS,
        },
      }, {
        id: 'error',
        type: 'json',
        options: {
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
        type: 'middleware',
        options: {
          middleware: (req, res) => {
            const userId = req.params.id;
            const user = USERS.find((userData) => userData.id === Number(userId));
            if (user) {
              res.status(200);
              res.send(user);
            } else {
              res.status(404);
              res.send({
                message: 'User not found', messageId: 'not-found'
              });
            }
          },
        }
      },
      {
        id: 'random',
        type: 'middleware',
        options: { middleware: (req, res) => res.status(200).send(makeRandomFakeUserDTO(Number(req.params.id))), }
      }
    ],
  },
  {
    id: 'admin-update-user',
    url: '/api/users/:id',
    method: 'POST',
    variants: [
      {
        id: 'unauthorized',
        type: 'json',
        options: {
          status: 401,
          body: { message: 'Not authorized to edit this user', messageId: 'not-authorized', }
        }
      },
      {
        id: 'bad request',
        type: 'json',
        options: {
          status: 400,
          body: { message: 'Bad request: Missing something', messageId: 'bad-request', }
        }
      },
      {
        id: 'real',
        type: 'middleware',
        options: {
          middleware: (req, res) => {
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
        }
      },
    ],
  },
];