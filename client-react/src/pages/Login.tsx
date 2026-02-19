import { User as UserType } from "../api";

interface LoginProps {
  user: UserType | null;
  setUser: (user: UserType | null) => void;
}

export function Login({ user, setUser }: LoginProps) {
    return (
        <>
            <h1 className="text-2xl font-bold font-serif">Login</h1>
        </>
    );
}