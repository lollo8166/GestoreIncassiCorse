import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";

const Login = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-md p-6 bg-white rounded shadow">
        <h2 className="text-2xl font-bold mb-4 text-center">Accedi</h2>
        <Auth
          supabaseClient={supabase}
          providers={[]}
          appearance={{ theme: ThemeSupa }}
          theme="light"
        />
      </div>
    </div>
  );
};

export default Login;