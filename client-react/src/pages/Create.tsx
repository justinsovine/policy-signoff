import { User as UserType } from "@/types";

interface CreateProps {
  user: UserType | null;
  setUser: (user: UserType | null) => void;
}

export function Create({ user, setUser }: CreateProps) {
    return (
        <>
            <h1 className="text-2xl font-bold font-serif">Create Policy</h1>
        </>
    );
}