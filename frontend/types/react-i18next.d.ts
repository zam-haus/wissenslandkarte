import "react-i18next";

import type admin from "../public/locales/en/admin.json";
import type common from "../public/locales/en/common.json";
import type faq from "../public/locales/en/faq.json";
import type landing_page from "../public/locales/en/landing-page.json";
import type login from "../public/locales/en/login.json";
import type projects from "../public/locales/en/projects.json";
import type search from "../public/locales/en/search.json";
import type users from "../public/locales/en/users.json";

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "common";
    resources: {
      admin: typeof admin;
      common: typeof common;
      users: typeof users;
      projects: typeof projects;
      "landing-page": typeof landing_page;
      search: typeof search;
      login: typeof login;
      faq: typeof faq;
    };
  }
}
