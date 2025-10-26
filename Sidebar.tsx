import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  History,
  Plus,
  Download,
  Upload,
  Settings,
  Trash2,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import SettingsDialog from "./SettingsDialog";

interface Conversation {
  id: string;
  title: string;
  timestamp: Date;
  messages: Array<{
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
  }>;
}

interface SidebarProps {
  onNewChat: () => void;
  onLoadConversation: (conversation: Conversation) => void;
  currentMessages: Array<{ role: "user" | "assistant"; content: string; timestamp: Date }>;
}

const Sidebar = ({ onNewChat, onLoadConversation, currentMessages }: SidebarProps) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);

  const saveCurrentConversation = () => {
    if (!currentConversationId || currentMessages.length === 0) return;

    const title = currentMessages[0]?.content.slice(0, 50) || "New Conversation";
    const existingIndex = conversations.findIndex((c) => c.id === currentConversationId);

    const updatedConversation: Conversation = {
      id: currentConversationId,
      title,
      timestamp: new Date(),
      messages: currentMessages,
    };

    if (existingIndex >= 0) {
      const updated = [...conversations];
      updated[existingIndex] = updatedConversation;
      setConversations(updated);
    } else {
      setConversations([updatedConversation, ...conversations]);
    }
  };

  // Auto-save conversation when messages change
  useEffect(() => {
    if (currentMessages.length > 0) {
      // Create new conversation ID if none exists
      if (!currentConversationId) {
        setCurrentConversationId(Date.now().toString());
      } else {
        // Auto-save after a short delay
        const timeoutId = setTimeout(() => {
          saveCurrentConversation();
        }, 1000);
        return () => clearTimeout(timeoutId);
      }
    }
  }, [currentMessages, currentConversationId]);

  const handleNewChat = () => {
    // Save current conversation before starting new one
    if (currentConversationId && currentMessages.length > 0) {
      saveCurrentConversation();
    }

    const newId = Date.now().toString();
    setCurrentConversationId(newId);
    onNewChat();
    toast.success("New conversation started");
  };

  const handleLoadConversation = (conversation: Conversation) => {
    // Save current before loading another
    if (currentConversationId && currentMessages.length > 0) {
      saveCurrentConversation();
    }

    setCurrentConversationId(conversation.id);
    onLoadConversation(conversation);
    toast.success(`Loaded: ${conversation.title}`);
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(conversations, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "lony-chat-history.json";
    link.click();
    toast.success("Chat history exported");
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);
          setConversations(data);
          toast.success("Chat history imported");
        } catch (error) {
          toast.error("Failed to import chat history");
        }
      };
      reader.readAsText(file);
    }
  };

  const handleClearHistory = () => {
    setConversations([]);
    toast.success("Chat history cleared");
  };

  return (
    <div className="w-64 h-screen glass-effect border-r border-border/50 flex flex-col">
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-6 h-6 text-primary" />
          <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Lony Chat
          </h1>
        </div>
        <Button onClick={handleNewChat} className="w-full glow-primary">
          <Plus className="w-4 h-4 mr-2" />
          New Chat
        </Button>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
            <History className="w-4 h-4" />
            History
          </h3>
          {conversations.length === 0 ? (
            <p className="text-xs text-muted-foreground">No conversations yet</p>
          ) : (
            conversations.map((conv) => (
              <Button
                key={conv.id}
                variant={currentConversationId === conv.id ? "secondary" : "ghost"}
                className="w-full justify-start text-left"
                onClick={() => handleLoadConversation(conv)}
              >
                <div className="truncate">
                  <p className="text-sm truncate">{conv.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {conv.timestamp.toLocaleDateString()}
                  </p>
                </div>
              </Button>
            ))
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-border/50 space-y-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start"
          onClick={handleExport}
        >
          <Download className="w-4 h-4 mr-2" />
          Export History
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start"
          asChild
        >
          <label>
            <Upload className="w-4 h-4 mr-2" />
            Import History
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </label>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-destructive hover:text-destructive"
          onClick={handleClearHistory}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Clear History
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start"
          onClick={() => setSettingsOpen(true)}
        >
          <Settings className="w-4 h-4 mr-2" />
          Settings
        </Button>
      </div>

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
};

export default Sidebar;
