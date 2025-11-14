import { Bot } from "lucide-react";
import { cn } from "@/lib/utils";

export function TypingIndicator() {
  return (
    <div className="py-8 px-4 bg-chat-assistant">
      <div className="max-w-3xl mx-auto flex gap-4">
        <div className="w-8 h-8 rounded-sm flex items-center justify-center flex-shrink-0 bg-accent">
          <Bot className="h-5 w-5 text-accent-foreground" />
        </div>
        <div className="flex-1">
          <div className="flex gap-1 items-center">
            <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
            <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "150ms" }} />
            <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        </div>
      </div>
    </div>
  );
}
