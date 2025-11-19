import React, { useState } from "react";
import { BrowserRouter as Router, Switch, Route, NavLink } from "react-router-dom";
import { IonApp, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonIcon } from "@ionic/react";
import {
  menuOutline,
  chevronBackOutline,
  homeOutline,
  bulbOutline,
  peopleOutline,
  statsChartOutline,
} from "ionicons/icons";

import Home from "./pages/Home";
import Recommendations from "./pages/Recommendations";
import CommunityProjects from "./pages/CommunityProjects";
import AdminReports from "./pages/AdminReports";

import "./styles.css";

function Sidebar({ collapsed, onToggle }) {
  const items = [
    { to: "/", label: "Home", icon: homeOutline, exact: true },
    { to: "/recommendations", label: "Recommendations & Savings", icon: bulbOutline },
    { to: "/community-projects", label: "Community Projects", icon: peopleOutline },
    { to: "/admin-reports", label: "Admin Reports", icon: statsChartOutline },
  ];

  return (
    <aside className={`app-sidebar ${collapsed ? "collapsed" : "expanded"}`} aria-hidden={false}>
      <div className="sidebar-top">
        <div className="brand">
          <div className="brand-icon">🌱</div>
          {!collapsed && <h2>Rooftop-AI</h2>}
        </div>

        <IonButton fill="clear" className="collapse-btn" onClick={onToggle} aria-pressed={collapsed}>
          <IonIcon icon={collapsed ? menuOutline : chevronBackOutline} />
        </IonButton>
      </div>

      <nav className="menu" role="navigation" aria-label="Main">
        {items.map((it) => (
          <NavLink
            key={it.to}
            exact={it.exact}
            to={it.to}
            className="menu-link"
            activeClassName="menu-link--active"
            title={it.label}
          >
            <div className="menu-icon">
              <IonIcon icon={it.icon} />
            </div>
            {!collapsed && <span className="menu-label">{it.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        {!collapsed && <small>Powered by AI • Sustainable rooftops</small>}
      </div>
    </aside>
  );
}

function AppShell() {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className={`app-shell ${collapsed ? "sidebar-collapsed" : "sidebar-open"}`}>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />

      <main className="app-main">
        <IonHeader>
          <IonToolbar color="primary">
            <IonTitle>Rooftop-AI</IonTitle>
          </IonToolbar>
        </IonHeader>

        <IonContent className="ion-padding">
          <Switch>
            <Route exact path="/" component={Home} />
            <Route path="/recommendations" component={Recommendations} />
            <Route path="/community-projects" component={CommunityProjects} />
            <Route path="/admin-reports" component={AdminReports} />
          </Switch>
        </IonContent>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <IonApp>
      <Router>
        <AppShell />
      </Router>
    </IonApp>
  );
}
