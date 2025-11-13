import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

type Session = Awaited<ReturnType<typeof supabase.auth.getSession>>["data"]["session"];

const SessionContext = createContext<Session | null>(null);

export const useSession = () => useContext(SessionContext);

export const SessionContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        navigate("/");
      } else {
        navigate("/login");
      }
    });
    return () => {
      listener.subscription.unsubscribe();
    };
  }, [navigate]);

  return <SessionContext.Provider value={session}>{children}</SessionContext.Provider>;
};