import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import ChatInterface from "@/components/ChatInterface";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  imageUrl?: string;
  userImageUrl?: string;
}

const Index = () => {
  const [currentMessages, setCurrentMessages] = useState<
    Array<{ role: "user" | "assistant"; content: string; timestamp: Date }>
  >([]);
  const [loadedMessages, setLoadedMessages] = useState<Message[] | undefined>(undefined);

  const handleNewChat = () => {
    setLoadedMessages([]);
    window.dispatchEvent(new CustomEvent("clear-chat", { detail: "clear-chat" }));
  };

  const handleLoadConversation = (conversation: any) => {
    const messages = conversation.messages.map((m: any, i: number) => ({
      id: `${conversation.id}-${i}`,
      role: m.role,
      content: m.content,
      timestamp: new Date(m.timestamp),
    }));
    setLoadedMessages(messages);
  };

  const handleMessagesChange = (
    messages: Array<{ role: "user" | "assistant"; content: string; timestamp: Date }>
  ) => {
    setCurrentMessages(messages);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        onNewChat={handleNewChat}
        onLoadConversation={handleLoadConversation}
        currentMessages={currentMessages}
      />
      <div className="flex-1">
        <ChatInterface
          onClear={handleNewChat}
          onMessagesChange={handleMessagesChange}
          initialMessages={loadedMessages}
        />
      </div>
    </div>
  );
};

export default Index;
