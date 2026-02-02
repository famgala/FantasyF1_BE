import CreateLeagueForm from '../components/CreateLeagueForm';
import { MobileNav } from '../components/MobileNav';

export default function CreateLeague() {
  return (
    <>
      <MobileNav />
      <div className="create-league-page">
      <div className="container">
        <CreateLeagueForm />
      </div>
    </div>
    </>
  );
}