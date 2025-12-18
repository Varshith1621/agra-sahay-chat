import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { sendMessageToAI } from "@/utils/chatService";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { SettingsDialog } from "@/components/SettingsDialog";
import ConversationList from "@/components/ConversationList";
import VoiceInput from "@/components/VoiceInput";
import ImageUpload from "@/components/ImageUpload";
import { TypingIndicator } from "@/components/TypingIndicator";
import MapView from "@/components/MapView";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Menu, Sprout, Download, Star, Map, Settings } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  id: string;
  isFavorite?: boolean;
}

export default function Index() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState("en");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (currentConversationId) {
      loadConversation(currentConversationId);
    } else {
      setMessages([]);
    }
  }, [currentConversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadConversation = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*, favorites(id)")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      setMessages(
        data.map((msg: any) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          isFavorite: msg.favorites.length > 0,
        }))
      );
    } catch (error: any) {
      console.error("Error loading conversation:", error);
      toast.error("Failed to load conversation");
    }
  };

  const saveMessage = async (conversationId: string, role: string, content: string) => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .insert({ conversation_id: conversationId, role, content })
        .select()
        .single();

      if (error) throw error;
      return data.id;
    } catch (error: any) {
      console.error("Error saving message:", error);
      throw error;
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!content.trim() && !imagePreview) return;

    let conversationId = currentConversationId;

    if (!conversationId) {
      try {
        const { data, error } = await supabase
          .from("conversations")
          .insert({ user_id: user.id, title: content.slice(0, 50) })
          .select()
          .single();

        if (error) throw error;
        conversationId = data.id;
        setCurrentConversationId(conversationId);
      } catch (error: any) {
        toast.error("Failed to create conversation");
        return;
      }
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: content.trim() || "Analyze this image",
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setImagePreview(null);

    try {
      const messageId = await saveMessage(conversationId, "user", userMessage.content);
      userMessage.id = messageId;

      const response = await sendMessageToAI(
        messages
          .concat([userMessage])
          .map((m) => ({ role: m.role, content: m.content })),
        language
      );

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response,
      };

      const assistantId = await saveMessage(conversationId, "assistant", response);
      assistantMessage.id = assistantId;

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error.message || "Failed to get response");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const handleExportPDF = () => {
    const content = messages
      .map((m) => `${m.role === "user" ? "You" : "AgriBot"}: ${m.content}`)
      .join("\n\n");

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "agribot-chat-export.txt";
    a.click();
    toast.success("Chat exported successfully!");
  };

  const toggleFavorite = async (messageId: string) => {
    const message = messages.find((m) => m.id === messageId);
    if (!message) return;

    try {
      if (message.isFavorite) {
        await supabase.from("favorites").delete().eq("message_id", messageId);
      } else {
        await supabase.from("favorites").insert({ user_id: user.id, message_id: messageId });
      }

      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, isFavorite: !m.isFavorite } : m
        )
      );
    } catch (error: any) {
      toast.error("Failed to update favorite");
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen flex bg-background">
      <aside className="hidden md:flex w-64 border-r border-border flex-col">
        <div className="p-4 border-b border-border flex items-center gap-2">
          <Sprout className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold">AgriBot</h1>
        </div>
        <ConversationList
          currentConversationId={currentConversationId}
          onSelectConversation={setCurrentConversationId}
        />
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="h-16 border-b border-border flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64">
                <div className="p-4 border-b border-border flex items-center gap-2">
                  <Sprout className="h-6 w-6 text-primary" />
                  <h1 className="text-xl font-bold">AgriBot</h1>
                </div>
                <ConversationList
                  currentConversationId={currentConversationId}
                  onSelectConversation={setCurrentConversationId}
                />
              </SheetContent>
            </Sheet>
            <Sprout className="h-6 w-6 text-primary md:hidden" />
            <span className="font-semibold hidden sm:inline">Agricultural Assistant</span>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setMapOpen(!mapOpen)} title="Maps">
              <Map className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleExportPDF} title="Export Chat">
              <Download className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setSettingsOpen(true)} title="Settings">
              <Settings className="h-5 w-5" />
            </Button>
            <SettingsDialog 
              open={settingsOpen} 
              onOpenChange={setSettingsOpen} 
              language={language} 
              onLanguageChange={setLanguage}
              onClearHistory={() => {}}
              user={user}
              onSignOut={handleSignOut}
            />
          </div>
        </header>

        <ScrollArea className="flex-1">
          <div className="max-w-4xl mx-auto p-4 space-y-6">
            {mapOpen && (
              <div className="mb-6">
                <MapView />
              </div>
            )}
            {messages.length === 0 ? (
              <div className="text-center py-8 md:py-16 px-4">
                <div className="inline-flex items-center justify-center w-20 h-20 md:w-24 md:h-24 bg-primary/10 rounded-full mb-6">
                  <Sprout className="h-10 w-10 md:h-16 md:w-16 text-primary" />
                </div>
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3">Welcome to AgriBot</h2>
                <p className="text-sm md:text-base text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
                  Your intelligent agricultural assistant for farming advice, crop management, market insights, and government schemes.
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3 md:gap-4 max-w-3xl mx-auto mb-8">
                  <div className="group p-4 md:p-6 border-2 border-border rounded-xl hover:border-primary/50 hover:shadow-lg transition-all duration-300 cursor-pointer bg-card">
                    <div className="text-3xl md:text-4xl mb-3">🌾</div>
                    <h3 className="font-semibold text-base md:text-lg mb-2">Crop Advisory</h3>
                    <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                      Expert recommendations on crops, fertilizers, irrigation, and pest control
                    </p>
                  </div>
                  
                  <div className="group p-4 md:p-6 border-2 border-border rounded-xl hover:border-primary/50 hover:shadow-lg transition-all duration-300 cursor-pointer bg-card">
                    <div className="text-3xl md:text-4xl mb-3">🌤️</div>
                    <h3 className="font-semibold text-base md:text-lg mb-2">Weather Guidance</h3>
                    <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                      Real-time weather-based farming suggestions and seasonal planning
                    </p>
                  </div>
                  
                  <div className="group p-4 md:p-6 border-2 border-border rounded-xl hover:border-primary/50 hover:shadow-lg transition-all duration-300 cursor-pointer bg-card">
                    <div className="text-3xl md:text-4xl mb-3">📊</div>
                    <h3 className="font-semibold text-base md:text-lg mb-2">Market Intelligence</h3>
                    <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                      Current crop prices, market trends, and best time to sell
                    </p>
                  </div>
                  
                  <div className="group p-4 md:p-6 border-2 border-border rounded-xl hover:border-primary/50 hover:shadow-lg transition-all duration-300 cursor-pointer bg-card">
                    <div className="text-3xl md:text-4xl mb-3">🏛️</div>
                    <h3 className="font-semibold text-base md:text-lg mb-2">Government Schemes</h3>
                    <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                      Information on subsidies, loans, and agricultural programs
                    </p>
                  </div>
                </div>

                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 md:p-6 max-w-2xl mx-auto">
                  <h3 className="font-semibold text-sm md:text-base mb-3 text-primary">Try asking:</h3>
                  <div className="grid grid-cols-1 gap-2 text-left">
                    <button 
                      onClick={() => handleSendMessage("What crops are best for monsoon season?")}
                      className="text-xs md:text-sm p-3 bg-background hover:bg-muted rounded-lg transition-colors text-left border border-border"
                    >
                      💧 What crops are best for monsoon season?
                    </button>
                    <button 
                      onClick={() => handleSendMessage("How can I control pests in my wheat field?")}
                      className="text-xs md:text-sm p-3 bg-background hover:bg-muted rounded-lg transition-colors text-left border border-border"
                    >
                      🐛 How can I control pests in my wheat field?
                    </button>
                    <button 
                      onClick={() => handleSendMessage("What government schemes are available for small farmers?")}
                      className="text-xs md:text-sm p-3 bg-background hover:bg-muted rounded-lg transition-colors text-left border border-border"
                    >
                      📋 What government schemes are available for small farmers?
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <div key={message.id} className="flex gap-2 items-start">
                  <div className="flex-1">
                    <ChatMessage role={message.role} content={message.content} />
                  </div>
                  {message.role === "assistant" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={() => toggleFavorite(message.id)}
                    >
                      <Star className={`h-4 w-4 ${message.isFavorite ? "fill-yellow-400 text-yellow-400" : ""}`} />
                    </Button>
                  )}
                </div>
              ))
            )}
            {isLoading && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <footer className="border-t border-border p-3 md:p-4 bg-background">
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-2 items-end">
              <div className="flex gap-2 shrink-0">
                <VoiceInput onTranscript={handleSendMessage} language={language} />
                <ImageUpload
                  onImageSelect={setImagePreview}
                  onImageRemove={() => setImagePreview(null)}
                  imagePreview={imagePreview}
                />
              </div>
              <div className="flex-1">
                <ChatInput onSend={handleSendMessage} disabled={isLoading} />
              </div>
            </div>
            {imagePreview && (
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Image ready for analysis
              </p>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}