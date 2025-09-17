import { ParseKeys } from "i18next";

import { Namespaces } from "./i18n-namespaces";

type PageTitleOverride<NS extends Namespaces> = { ns: NS; key: ParseKeys<NS> };

export type OverrideHandle<NS extends Namespaces = Namespaces> = {
  pageTitleOverride: PageTitleOverride<NS>;
};

export type Handle<NS = never> =
  | OverrideHandle<NS>
  | {
      i18n?: [NS, ...Namespaces[]];
    };
