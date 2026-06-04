import { Outlet } from "react-router-dom";
import "./AppShell.css";

function AppShell() {
  return (
    <div className="app-root">
      <div className="app-shell">
        <Outlet />
      </div>
    </div>
  );
}

export default AppShell;