import React from "react";
import CreateLeagueForm from "../../components/league/CreateLeagueForm";
import * as S from "./CreateLeaguePage.scss";

const CreateLeaguePage: React.FC = () => {
  return (
    <S.PageContainer>
      <S.PageHeader>
        <S.PageTitle>Create League</S.PageTitle>
      </S.PageHeader>
      <S.PageContent>
        <CreateLeagueForm />
      </S.PageContent>
    </S.PageContainer>
  );
};

export default CreateLeaguePage;
