import { Link } from "@remix-run/react";

import style from "./action-bar.module.css";

export function ActionBar() {
  return (
    <nav className={style.actionBarNav}>
      <Link to="/projects/new">New</Link>
      <Link to="/projects/mine">Projects</Link>
      <Link to="/projects/update/new" className={style.mainItem}>
        Add
      </Link>
      <Link to="/search">Search</Link>
      <Link to="/users/me">Profile</Link>
    </nav>
  );
}
