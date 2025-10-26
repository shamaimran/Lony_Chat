import { Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  imageUrl?: string;
  userImageUrl?: string;
}

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble = ({ message }: MessageBubbleProps) => {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex gap-3 animate-fade-in",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center glow-primary">
          <Bot className="w-5 h-5 text-primary" />
        </div>
      )}

      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-3 glass-effect",
          isUser
            ? "bg-primary/10 border-primary/20"
            : "bg-card/50 border-border/50"
        )}
      >
        {message.userImageUrl && (
          <img
            src={message.userImageUrl}
            alt="User uploaded"
            className="rounded-lg mb-2 max-w-full max-h-64 object-contain"
          />
        )}
        {message.imageUrl && (
          <img
            src={message.imageUrl}
            alt="Generated"
            className="rounded-lg mb-2 max-w-full h-auto"
          />
        )}
        <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
          {message.content}
        </pre>
        <div className="text-xs text-muted-foreground mt-2">
          {message.timestamp.toLocaleTimeString()}
        </div>
      </div>

      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center glow-accent">
          <User className="w-5 h-5 text-accent" />
        </div>
      )}
    </div>
  );
};

export default MessageBubble;
