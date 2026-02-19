import { User as UserType } from "../api";

interface DashboardProps {
  user: UserType | null;
  setUser: (user: UserType | null) => void;
}

export function Dashboard({ user, setUser }: DashboardProps) {
  return (
    <>
      <h1 className="text-2xl font-bold font-serif">Dashboard</h1>
    </>
  );
}