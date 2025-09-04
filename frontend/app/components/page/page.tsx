import { Link, UIMatch, useMatches } from "@remix-run/react";
import { ParseKeys } from "i18next";
import React, { type PropsWithChildren, PropsWithRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { ActionBar } from "./action-bar";

type GlobalButtonConfig = {
  relativeRoute: string;
  icon: string;
  i18nLabelKey: ParseKeys<"common">;
};

type GlobalButton = GlobalButtonConfig & {
  route: string;
};

export function conditionalShowGlobalButtons(buttons: {
  editButton?: boolean;
  deleteButton?: boolean;
}): { globalButtons: GlobalButtonConfig[] } {
  const editButton = {
    relativeRoute: "edit",
    i18nLabelKey: "toplevel-edit" as const,
    icon: "edit",
  };
  const deleteButton = {
    relativeRoute: "delete",
    i18nLabelKey: "toplevel-delete" as const,
    icon: "delete",
  };
  return {
    globalButtons: [
      ...(buttons.editButton ? [editButton] : []),
      ...(buttons.deleteButton ? [deleteButton] : []),
    ],
  };
}

function getGlobalButtonRequests(routes: UIMatch[]): GlobalButton[] {
  return routes.flatMap((route) => {
    if (typeof route.data === "object" && route.data !== null && "globalButtons" in route.data) {
      return (route.data.globalButtons as GlobalButtonConfig[]).map((button) => ({
        ...button,
        route: route.pathname + "/" + button.relativeRoute,
      }));
    }
    return [];
  });
}

export function Page({
  title,
  isLoggedIn,
  children,
  additionalNavItems,
}: PropsWithChildren<{
  title: string;
  isLoggedIn: boolean;
  additionalNavItems?: React.JSX.Element;
}>) {
  const { t } = useTranslation("common");

  const [menuOpen, setMenuOpen] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);

  const matches = useMatches();
  const globalButtonRequests = getGlobalButtonRequests(matches);

  if (
    !matches.some(
      (route) =>
        typeof route.handle === "object" &&
        route.handle != null &&
        "i18n" in route.handle &&
        Array.isArray(route.handle.i18n) &&
        route.handle.i18n.includes("common"),
    )
  ) {
    throw Error("Route does not include 'common' i18n resources in its handle export.");
  }

  return (
    <>
      <header className="fill">
        <nav>
          <button onClick={() => setMenuOpen(!menuOpen)} className="s circle transparent">
            <i>menu</i>
          </button>

          <h1 className="max center-align" style={{ fontSize: "1.5rem" }}>
            {title}
          </h1>

          <GlobalButtons globalButtonRequests={globalButtonRequests} />
        </nav>
      </header>

      <nav
        className={"left " + (menuOpen ? "s max" : "")}
        style={{ display: menuOpen ? "block" : "none" }}
      >
        <button className="transparent" onClick={() => setMenuOpen(false)}>
          <i>arrow_back</i>
        </button>

        <NavItems isLoggedIn={isLoggedIn} additionalNavItems={additionalNavItems} />
      </nav>

      <div id="globalScrollContainer" style={{ overflowY: "auto", flex: 1, minBlockSize: 0 }}>
        <nav className={"m l left"} style={{ position: "sticky", insetBlockStart: 100 }}>
          <NavItems isLoggedIn={isLoggedIn} additionalNavItems={additionalNavItems} />
        </nav>
        {children}
      </div>
      <footer style={{ padding: "0 " }}>{isLoggedIn ? <ActionBar /> : <></>}</footer>
    </>
  );
}

function NavItems({
  isLoggedIn,
  additionalNavItems,
}: PropsWithRef<{
  isLoggedIn: boolean;
  additionalNavItems?: React.JSX.Element;
}>) {
  const { t } = useTranslation("common");

  const loginSection = isLoggedIn ? (
    <>
      <Link to="/users/me">
        <i>account_box</i>
        {t("nav-profile")}
      </Link>

      <Link to="/logout">
        <i>logout</i>
        {t("nav-logout")}
      </Link>
    </>
  ) : (
    <>
      <Link to="/login">
        <i>login</i>
        {t("nav-login")}
      </Link>
    </>
  );

  return (
    <>
      <Link to="/">
        <i>home</i>
        {t("nav-landing-page")}
      </Link>

      <Link to="/search">
        <i>search</i>
        {t("nav-search")}
      </Link>

      <Link to="/projects">
        <i>handyman</i>
        {t("nav-projects")}
      </Link>

      <Link to="/users">
        <i>group</i>
        {t("nav-people")}
      </Link>

      <Link to="/">
        <i>help</i>
        {t("nav-faq")}
      </Link>

      {additionalNavItems}
      {loginSection}
    </>
  );
}

function GlobalButtons({ globalButtonRequests }: { globalButtonRequests: GlobalButton[] }) {
  const { t } = useTranslation("common");

  if (globalButtonRequests.length === 0) {
    return null;
  }

  return (
    <button className="transparent square">
      <i>more_vert</i>
      <menu className="border no-wrap left">
        {globalButtonRequests.map((button) => (
          <li>
            <Link key={button.route + button.i18nLabelKey} to={button.route}>
              <i>{button.icon}</i>
              <span>{t(button.i18nLabelKey)}</span>
            </Link>
          </li>
        ))}
      </menu>
    </button>
  );
}
