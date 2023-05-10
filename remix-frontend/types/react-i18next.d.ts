import 'react-i18next';

import type common from '../public/locales/en/common.json';
import type users from '../public/locales/en/users.json';


declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: {
      common: typeof common;
      users: typeof users;
    };
  };
};