import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are an expert agricultural advisor for farmers in India. When a user mentions ANY location (city, district, village, state), you MUST provide a comprehensive report in this EXACT format:

📍 **Location: [Location Name]**

🌤️ **Current Weather & Climate:**
- Temperature: [typical range for current season]
- Humidity: [typical level]
- Rainfall: [expected rainfall pattern]
- Season: [current agricultural season - Kharif/Rabi/Zaid]

🌾 **Recommended Crops for This Season:**
1. [Crop 1] - Best suited because [reason]
2. [Crop 2] - Best suited because [reason]
3. [Crop 3] - Best suited because [reason]

🐛 **Pest & Disease Management:**
- Common pests in this region: [list 2-3 pests]
- Recommended pesticides:
  * [Pesticide 1] - For [pest/disease]
  * [Pesticide 2] - For [pest/disease]
- Organic alternatives: [list options]

💧 **Irrigation Advice:**
- Recommended method: [drip/flood/sprinkler]
- Frequency: [based on soil and weather]

🏪 **Nearby Markets (Mandis):**
- [Market 1] - Crops traded, approximate distance
- [Market 2] - Crops traded, approximate distance

💡 **Additional Tips:**
- [Specific advice for the location and season]

Always be specific to the location mentioned. Use your knowledge of Indian agriculture, regional crops, local climate patterns, and common farming practices. If asked follow-up questions, provide detailed answers about that specific aspect.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded, please try again later." }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required, please add credits to your workspace." }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI gateway error" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
      },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
