import { RouteExport } from '../mocks';
import { UserDTO, CurrentUserDTO } from '../models/user';
import { PROJECTS, makeRandomFakeProjectDto, projectToProjectListEntry } from '../fakeData/projects';
import { USERS } from '../fakeData/users';
import { TAGS } from '../fakeData/tags';


module.exports = <RouteExport>[
  {
    id: 'get-all-projects',
    url: '/api/projects',
    method: 'GET',
    variants: [
      {
        id: 'success',
        response: (req, res) => {
          if (req.query.view === 'short') {
            res.status(200).send(PROJECTS.map(projectToProjectListEntry))
          } else {
            res.status(200).send(PROJECTS);
          }
        }
      }, {
        id: 'error',
        response: {
          status: 400,
          body: { message: 'Unspecified error occured', messageId: 'unspecified-error' },
        },
      },
    ],
  },
  {
    id: 'get-project',
    url: '/api/projects/:id',
    method: 'GET',
    variants: [
      {
        id: 'real',
        response: (req, res) => {
          const projectId = req.params.id;
          const project = PROJECTS.find((projectData) => projectData.id === Number(projectId));
          if (project) {
            res.status(200);
            res.send(project);
          } else {
            res.status(404);
            res.send({
              message: 'Project not found', messageId: 'not-found'
            });
          }
        },
      },
      {
        id: 'random',
        response: (req, res) => res.status(200).send(makeRandomFakeProjectDto(0, USERS, [])),
      }
    ],
  },
  {
    id: 'update-project',
    url: '/api/project/:id',
    method: 'POST',
    variants: [
      {
        id: 'unauthorized',
        response: {
          status: 401,
          body: { message: 'Not authorized to edit this project', messageId: 'not-authorized', }
        }
      },
      {
        id: 'bad request',
        response: {
          status: 400,
          body: { message: 'Bad request: Missing something', messageId: 'bad-request', }
        }
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