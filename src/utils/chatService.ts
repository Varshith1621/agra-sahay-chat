import { supabase } from "@/integrations/supabase/client";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export async function sendMessageToAI(
  messages: Message[],
  language: string = "en"
): Promise<string> {
  try {
    const { data, error } = await supabase.functions.invoke('agricultural-chat', {
      body: { 
        messages,
        language 
      }
    });

    if (error) {
      console.error("Edge function error:", error);
      throw new Error(error.message || "Failed to get AI response");
    }

    if (!data || !data.message) {
      throw new Error("Invalid response from server");
    }

    return data.message;
  } catch (error) {
    console.error("Error calling AI service:", error);
    throw error;
  }
}
