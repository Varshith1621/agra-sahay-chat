import { useState, useEffect, useRef } from "react";
import { ChatSidebar } from "@/components/ChatSidebar";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { TypingIndicator } from "@/components/TypingIndicator";
import { SettingsDialog } from "@/components/SettingsDialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { sendMessageToAI } from "@/utils/chatService";
import { toast } from "sonner";
import { Sprout } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  timestamp: number;
}

const Index = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [language, setLanguage] = useState("en");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load data from localStorage
  useEffect(() => {
    const savedConversations = localStorage.getItem("agri-conversations");
    const savedLanguage = localStorage.getItem("agri-language");
    const savedTheme = localStorage.getItem("agri-theme");

    if (savedConversations) {
      const parsed = JSON.parse(savedConversations);
      setConversations(parsed);
      if (parsed.length > 0) {
        setCurrentConversationId(parsed[0].id);
      }
    }
    if (savedLanguage) setLanguage(savedLanguage);
    if (savedTheme) setTheme(savedTheme as "light" | "dark");
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (conversations.length > 0) {
      localStorage.setItem("agri-conversations", JSON.stringify(conversations));
    }
  }, [conversations]);

  useEffect(() => {
    localStorage.setItem("agri-language", language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem("agri-theme", theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [conversations, isLoading]);

  const currentConversation = conversations.find((c) => c.id === currentConversationId);

  const handleNewChat = () => {
    const newConv: Conversation = {
      id: Date.now().toString(),
      title: "New Chat",
      messages: [],
      timestamp: Date.now(),
    };
    setConversations([newConv, ...conversations]);
    setCurrentConversationId(newConv.id);
  };

  const handleSendMessage = async (content: string) => {
    if (!currentConversationId) {
      handleNewChat();
      return;
    }

    const userMessage: Message = { role: "user", content };

    // Update conversation with user message
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === currentConversationId
          ? {
              ...conv,
              messages: [...conv.messages, userMessage],
              title: conv.messages.length === 0 ? content.slice(0, 50) : conv.title,
              timestamp: Date.now(),
            }
          : conv
      )
    );

    setIsLoading(true);

    try {
      const response = await sendMessageToAI(
        [...(currentConversation?.messages || []), userMessage],
        language
      );

      const assistantMessage: Message = { role: "assistant", content: response };

      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === currentConversationId
            ? {
                ...conv,
                messages: [...conv.messages, assistantMessage],
                timestamp: Date.now(),
              }
            : conv
        )
      );
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error(error instanceof Error ? error.message : "Failed to send message");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    if (confirm("Are you sure you want to clear all chat history?")) {
      setConversations([]);
      setCurrentConversationId("");
      localStorage.removeItem("agri-conversations");
      toast.success("Chat history cleared");
      setSettingsOpen(false);
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <ChatSidebar
        conversations={conversations}
        currentConversationId={currentConversationId}
        onNewChat={handleNewChat}
        onSelectConversation={setCurrentConversationId}
        onOpenSettings={() => setSettingsOpen(true)}
        theme={theme}
        onToggleTheme={() => setTheme(theme === "light" ? "dark" : "light")}
      />

      <div className="flex-1 flex flex-col">
        {!currentConversation || currentConversation.messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4 p-8">
              <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                <Sprout className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-3xl font-bold">Agricultural Assistant</h1>
              <p className="text-muted-foreground max-w-md">
                Ask me anything about crops, weather, market prices, government schemes, and more.
                I'm here to help farmers with expert agricultural advice.
              </p>
            </div>
          </div>
        ) : (
          <ScrollArea className="flex-1">
            <div className="pb-32">
              {currentConversation.messages.map((msg, idx) => (
                <ChatMessage key={idx} role={msg.role} content={msg.content} />
              ))}
              {isLoading && <TypingIndicator />}
              <div ref={scrollRef} />
            </div>
          </ScrollArea>
        )}

        <ChatInput onSend={handleSendMessage} disabled={isLoading} />
      </div>

      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        language={language}
        onLanguageChange={setLanguage}
        onClearHistory={handleClearHistory}
      />
    </div>
  );
};

export default Index;
