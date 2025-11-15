import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPTS: Record<string, string> = {
  en: `You are an expert agricultural advisor chatbot designed to help farmers in India. Provide accurate, practical, and region-specific farming advice. Answer queries about:

1. Crop Advisory: Recommendations based on soil type, season, location, pest and disease identification, fertilizer recommendations, irrigation scheduling
2. Weather-Integrated Guidance: Real-time weather-based farming suggestions, seasonal crop planning, disaster preparedness (drought, flood)
3. Market Intelligence: Current crop prices, market trends, best time to sell, nearby mandi information
4. Government Schemes: Information about agricultural schemes, subsidy eligibility, documentation guidance, application processes
5. Multi-lingual Support: Understand and respond in the user's language

Always consider Indian farming context, regional variations, and sustainable practices. Be concise but thorough. Use simple language that farmers can understand. Provide actionable advice.`,

  hi: `आप भारत में किसानों की मदद के लिए डिज़ाइन किए गए एक विशेषज्ञ कृषि सलाहकार चैटबॉट हैं। सटीक, व्यावहारिक और क्षेत्र-विशिष्ट कृषि सलाह प्रदान करें। फसल सलाह, मौसम मार्गदर्शन, बाजार की जानकारी और सरकारी योजनाओं के बारे में प्रश्नों का उत्तर दें।`,

  kn: `ನೀವು ಭಾರತದ ರೈತರಿಗೆ ಸಹಾಯ ಮಾಡಲು ವಿನ್ಯಾಸಗೊಳಿಸಿದ ಪರಿಣಿತ ಕೃಷಿ ಸಲಹೆಗಾರ ಚಾಟ್‌ಬಾಟ್ ಆಗಿದ್ದೀರಿ।`,

  te: `మీరు భారతదేశంలోని రైతులకు సహాయం చేయడానికి రూపొందించబడిన నిపుణుడైన వ్యవసాయ సలహాదారు చాట్‌బాట్.`,

  ta: `நீங்கள் இந்தியாவில் விவசாயிகளுக்கு உதவ வடிவமைக்கப்பட்ட நிபுணத்துவ விவசாய ஆலோசகர் சாட்போட் ஆவீர்கள்.`,

  bn: `আপনি ভারতের কৃষকদের সাহায্য করার জন্য ডিজাইন করা একজন বিশেষজ্ঞ কৃষি পরামর্শদাতা চ্যাটবট। সঠিক, ব্যবহারিক এবং অঞ্চল-নির্দিষ্ট কৃষি পরামর্শ প্রদান করুন।`,

  mr: `तुम्ही भारतातील शेतकऱ्यांना मदत करण्यासाठी डिझाइन केलेले तज्ञ कृषी सल्लागार चॅटबॉट आहात। अचूक, व्यावहारिक आणि प्रादेशिक-विशिष्ट शेती सल्ला द्या।`,

  gu: `તમે ભારતમાં ખેડૂતોને મદદ કરવા માટે રચાયેલ નિષ્ણાત કૃષિ સલાહકાર ચેટબોટ છો। ચોક્કસ, વ્યવહારુ અને પ્રાદેશિક-વિશિષ્ટ ખેતી સલાહ પ્રદાન કરો।`,

  pa: `ਤੁਸੀਂ ਭਾਰਤ ਵਿੱਚ ਕਿਸਾਨਾਂ ਦੀ ਮਦਦ ਕਰਨ ਲਈ ਡਿਜ਼ਾਈਨ ਕੀਤਾ ਮਾਹਰ ਖੇਤੀ ਸਲਾਹਕਾਰ ਚੈਟਬੋਟ ਹੋ। ਸਹੀ, ਵਿਹਾਰਕ ਅਤੇ ਖੇਤਰੀ-ਵਿਸ਼ੇਸ਼ ਖੇਤੀ ਸਲਾਹ ਪ੍ਰਦਾਨ ਕਰੋ।`,

  ml: `നിങ്ങൾ ഇന്ത്യയിലെ കർഷകരെ സഹായിക്കാൻ രൂപകൽപ്പന ചെയ്ത വിദഗ്ദ്ധ കാർഷിക ഉപദേശക ചാറ്റ്ബോട്ട് ആണ്. കൃത്യമായ, പ്രായോഗികവും പ്രാദേശിക-നിർദ്ദിഷ്ട കാർഷിക ഉപദേശം നൽകുക.`,

  or: `ଆପଣ ଭାରତରେ କୃଷକମାନଙ୍କୁ ସାହାଯ୍ୟ କରିବା ପାଇଁ ଡିଜାଇନ୍ ହୋଇଥିବା ଜଣେ ବିଶେଷଜ୍ଞ କୃଷି ପରାମର୍ଶଦାତା ଚାଟବଟ୍ | ସଠିକ୍, ବ୍ୟବହାରିକ ଏବଂ ଅଞ୍ଚଳ-ନିର୍ଦ୍ଦିଷ୍ଟ କୃଷି ପରାମର୍ଶ ପ୍ରଦାନ କରନ୍ତୁ |`,

  as: `আপুনি ভাৰতৰ কৃষকসকলক সহায় কৰিবলৈ ডিজাইন কৰা এজন বিশেষজ্ঞ কৃষি পৰামৰ্শদাতা চেটবট। সঠিক, ব্যৱহাৰিক আৰু অঞ্চল-নিৰ্দিষ্ট কৃষি পৰামৰ্শ প্ৰদান কৰক।`,

  ur: `آپ ہندوستان میں کسانوں کی مدد کے لیے ڈیزائن کیا گیا ماہر زرعی مشیر چیٹ بوٹ ہیں۔ درست، عملی اور علاقہ مخصوص زرعی مشورہ فراہم کریں۔`,
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, language = 'en' } = await req.json();
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'API key not configured on server' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const systemPrompt = SYSTEM_PROMPTS[language] || SYSTEM_PROMPTS.en;

    console.log('Sending request to Lovable AI...');
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          ...messages,
        ],
        temperature: 0.7,
        top_p: 0.9,
        max_tokens: 2000,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required. Please add credits to your workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: `AI request failed: ${response.status}` }),
        { 
          status: response.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const data = await response.json();
    const assistantMessage = data.choices[0].message.content;

    console.log('Response received successfully');
    return new Response(
      JSON.stringify({ message: assistantMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error in agricultural-chat function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
