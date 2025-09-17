import { CustomTypeOptions, ParseKeys } from "i18next";

type Namespaces = keyof CustomTypeOptions["resources"];
type PageTitleOverride<NS extends Namespaces> = { ns: NS; key: ParseKeys<NS> };

export type OverrideHandle<NS extends Namespaces = Namespaces> = {
  pageTitleOverride: PageTitleOverride<NS>;
};

export type Handle<NS = never> =
  | OverrideHandle<NS>
  | {
      i18n?: [NS, ...Namespaces[]];
    };
