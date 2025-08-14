import React from "react";
import {
  Header,
  HeaderName,
  HeaderGlobalBar,
  HeaderGlobalAction,
} from "@carbon/react";
import { Menu, Search, Notification, Switcher } from "@carbon/icons-react";
import styles from "./AppHeader.module.css";
import { useNavigate } from "react-router-dom";

const AppHeader: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Header className={styles.headerRelative}>
      <HeaderName prefix="" href="/">
        <Menu />
        <div
          style={{
            marginLeft: "16px",
          }}
        >
          Publications Office of the European Union (v.1.0.0)
        </div>
      </HeaderName>
      <HeaderGlobalBar>
        <HeaderGlobalAction aria-label="Search" onClick={() => {}}>
          <Search />
        </HeaderGlobalAction>
        <HeaderGlobalAction aria-label="Notifications" onClick={() => {}}>
          <Notification />
        </HeaderGlobalAction>
        <HeaderGlobalAction
          aria-label="App Switcher"
          onClick={() => navigate("/prompttest")}
        >
          <Switcher />
        </HeaderGlobalAction>
      </HeaderGlobalBar>
    </Header>
  );
};

export default AppHeader;
