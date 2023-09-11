import 'react-i18next';

import type common from '../public/locales/en/common.json';
import type users from '../public/locales/en/users.json';
import type projects from '../public/locales/en/projects.json';
import type landing_page from '../public/locales/en/landing-page.json'


declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: {
      common: typeof common;
      users: typeof users;
      projects: typeof projects;
      "landing-page": typeof landing_page;
    };
  };
};