import { Button } from "@/components/ui/button";
import { useSession } from "./SessionContextProvider";
import { supabase } from "@/integrations/supabase/client";
import { LogOut } from "lucide-react";

export const UserMenu = () => {
  const session = useSession();
  const email = session?.user.email;

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (!email) return null;

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-700">{email}</span>
      <Button variant="outline" size="sm" onClick={handleLogout} className="flex items-center gap-1">
        <LogOut size={16} className="mr-1" />
        Logout
      </Button>
    </div>
  );
};