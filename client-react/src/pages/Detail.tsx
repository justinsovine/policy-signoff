import { User as UserType } from "@/types";

interface DetailProps {
  user: UserType | null;
  setUser: (user: UserType | null) => void;
}

export function Detail({ user, setUser }: DetailProps) {
    return (
        <>
            <h1 className="text-2xl font-bold font-serif">Policy Details</h1>
        </>
    );
}