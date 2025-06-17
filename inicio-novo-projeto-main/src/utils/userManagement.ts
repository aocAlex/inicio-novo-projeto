import { supabase } from "@/integrations/supabase/client";

export async function deleteUser(userId: string): Promise<{ success: boolean | null; error: any }> {
  const { data, error } = await supabase.auth.admin.deleteUser(userId);

  if (error) {
    console.error("Error deleting user:", error);
    return { success: false, error };
  }

  console.log("User deleted successfully:", data);
  return { success: true, error: null };
}
