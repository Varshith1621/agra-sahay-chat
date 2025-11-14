import { Plus, MessageSquare, Settings, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Conversation {
  id: string;
  title: string;
  timestamp: number;
}

interface ChatSidebarProps {
  conversations: Conversation[];
  currentConversationId: string;
  onNewChat: () => void;
  onSelectConversation: (id: string) => void;
  onOpenSettings: () => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
}

export function ChatSidebar({
  conversations,
  currentConversationId,
  onNewChat,
  onSelectConversation,
  onOpenSettings,
  theme,
  onToggleTheme,
}: ChatSidebarProps) {
  return (
    <div className="w-64 border-r border-border bg-sidebar flex flex-col h-screen">
      <div className="p-3 border-b border-sidebar-border">
        <Button onClick={onNewChat} className="w-full justify-start gap-2" variant="outline">
          <Plus className="h-4 w-4" />
          New Chat
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => onSelectConversation(conv.id)}
              className={cn(
                "w-full text-left px-3 py-2 rounded-md text-sm transition-colors",
                "hover:bg-sidebar-accent",
                currentConversationId === conv.id
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground"
              )}
            >
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{conv.title}</span>
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>

      <div className="p-3 border-t border-sidebar-border space-y-2">
        <Button
          onClick={onToggleTheme}
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2"
        >
          {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          {theme === "light" ? "Dark Mode" : "Light Mode"}
        </Button>
        <Button
          onClick={onOpenSettings}
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2"
        >
          <Settings className="h-4 w-4" />
          Settings
        </Button>
      </div>
    </div>
  );
}
