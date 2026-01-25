import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import * as S from "./JoinLeaguePage.scss";
import AppLayout from "../../components/layout/AppLayout";
import LeagueSearchForm from "../../components/league/LeagueSearchForm/LeagueSearchForm";
import JoinWithCodeForm from "../../components/league/JoinWithCodeForm/JoinWithCodeForm";
import { League } from "../../services/leagueService";

const JoinLeaguePage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"search" | "code">("search");

  const handleJoinLeague = (league: League) => {
    setTimeout(() => {
      navigate("/dashboard");
    }, 100);
  };

  return (
    <AppLayout>
      <div className={S.container}>
        <div className={S.header}>
          <h1 className={S.title}>Join a League</h1>
          <p className={S.subtitle}>
            Find and join existing leagues or enter an invite code
          </p>
        </div>

        <div className={S.tabsContainer}>
          <div className={S.tabsHeader}>
            <button
              className={`${S.tabButton} ${activeTab === "search" ? S.active : ""}`}
              onClick={() => setActiveTab("search")}
              data-tab="search"
            >
              <span className={S.tabIcon}>🔍</span>
              Browse Public Leagues
            </button>
            <button
              className={`${S.tabButton} ${activeTab === "code" ? S.active : ""}`}
              onClick={() => setActiveTab("code")}
              data-tab="code"
            >
              <span className={S.tabIcon}>🎫</span>
              Enter Invite Code
            </button>
          </div>

          <div className={S.tabContent}>
            {activeTab === "search" && (
              <LeagueSearchForm onJoinLeague={handleJoinLeague} />
            )}
            {activeTab === "code" && (
              <JoinWithCodeForm onJoinLeague={handleJoinLeague} />
            )}
          </div>
        </div>

        <div className={S.footer}>
          <p>
            Don't see what you're looking for?{" "}
            <button
              className={S.createLink}
              onClick={() => navigate("/leagues/create")}
            >
              Create your own league
            </button>
          </p>
        </div>
      </div>
    </AppLayout>
  );
};

export default JoinLeaguePage;
