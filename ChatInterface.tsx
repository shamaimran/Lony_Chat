import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Image, Paperclip, Sparkles, Code, Video, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import MessageBubble from "./MessageBubble";
import VoiceRecorder from "./VoiceRecorder";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  imageUrl?: string;
  userImageUrl?: string;
}

type ChatMode = "chat" | "code" | "image" | "video";

interface ChatInterfaceProps {
  onClear: () => void;
  onMessagesChange: (messages: Array<{ role: "user" | "assistant"; content: string; timestamp: Date }>) => void;
  initialMessages?: Message[];
}

const ChatInterface = ({ onClear, onMessagesChange, initialMessages }: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages || []);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<ChatMode>("chat");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  // Update messages when initialMessages change
  useEffect(() => {
    if (initialMessages) {
      setMessages(initialMessages);
    }
  }, [initialMessages]);

  // Notify parent of message changes
  useEffect(() => {
    onMessagesChange(
      messages.map((m) => ({
        role: m.role,
        content: m.content,
        timestamp: m.timestamp,
      }))
    );
  }, [messages, onMessagesChange]);

  // Clear messages when onClear is called
  useEffect(() => {
    const handleStorageChange = (e: CustomEvent) => {
      if (e.detail === "clear-chat") {
        setMessages([]);
        setInput("");
        setUploadedImage(null);
      }
    };
    window.addEventListener("clear-chat" as any, handleStorageChange as any);
    return () => {
      window.removeEventListener("clear-chat" as any, handleStorageChange as any);
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if ((!input.trim() && !uploadedImage) || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input || "Please analyze this image",
      timestamp: new Date(),
      userImageUrl: uploadedImage || undefined,
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentImage = uploadedImage;
    setInput("");
    setUploadedImage(null);
    setIsLoading(true);

    try {
      if (mode === "image") {
        // Generate image
        const { data, error } = await supabase.functions.invoke("generate-image", {
          body: { prompt: input },
        });

        if (error) throw error;

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "Here's your generated image:",
          timestamp: new Date(),
          imageUrl: data.imageUrl,
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        // Stream text response
        const allMessages = messages.map((m) => {
          if (m.userImageUrl) {
            return {
              role: m.role,
              content: [
                { type: "text", text: m.content },
                { type: "image_url", image_url: { url: m.userImageUrl } }
              ]
            };
          }
          return { role: m.role, content: m.content };
        });

        // Add current message with image if present
        if (currentImage) {
          allMessages.push({
            role: "user",
            content: [
              { type: "text", text: input || "Please analyze this image" },
              { type: "image_url", image_url: { url: currentImage } }
            ]
          });
        } else {
          allMessages.push({ role: "user", content: input });
        }

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: JSON.stringify({
              messages: allMessages,
              mode,
            }),
          }
        );

        if (!response.ok || !response.body) {
          throw new Error("Failed to start stream");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let textBuffer = "";
        let streamDone = false;
        let assistantContent = "";

        // Add initial assistant message
        const assistantId = (Date.now() + 1).toString();
        setMessages((prev) => [
          ...prev,
          {
            id: assistantId,
            role: "assistant",
            content: "",
            timestamp: new Date(),
          },
        ]);

        while (!streamDone) {
          const { done, value } = await reader.read();
          if (done) break;

          textBuffer += decoder.decode(value, { stream: true });

          let newlineIndex: number;
          while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
            let line = textBuffer.slice(0, newlineIndex);
            textBuffer = textBuffer.slice(newlineIndex + 1);

            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (line.startsWith(":") || line.trim() === "") continue;
            if (!line.startsWith("data: ")) continue;

            const jsonStr = line.slice(6).trim();
            if (jsonStr === "[DONE]") {
              streamDone = true;
              break;
            }

            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content as string | undefined;
              if (content) {
                assistantContent += content;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? { ...m, content: assistantContent }
                      : m
                  )
                );
              }
            } catch {
              textBuffer = line + "\n" + textBuffer;
              break;
            }
          }
        }
      }
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error.message || "Failed to send message");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
        toast.success(`Image uploaded: ${file.name}`);
      };
      reader.readAsDataURL(file);
    } else {
      toast.error("Please upload an image file");
    }
  };

  const handleVoiceTranscript = (transcript: string) => {
    setInput(transcript);
  };

  const modes = [
    { id: "chat", label: "Chat", icon: MessageSquare },
    { id: "code", label: "Code", icon: Code },
    { id: "image", label: "Image", icon: Image },
    { id: "video", label: "Video", icon: Video },
  ] as const;

  return (
    <div className="flex flex-col h-screen">
      {/* Mode Selector */}
      <div className="glass-effect border-b border-border/50 p-4">
        <div className="flex gap-2 max-w-4xl mx-auto">
          {modes.map((m) => (
            <Button
              key={m.id}
              variant={mode === m.id ? "default" : "ghost"}
              size="sm"
              onClick={() => setMode(m.id as ChatMode)}
              className={mode === m.id ? "glow-primary" : ""}
            >
              <m.icon className="w-4 h-4 mr-2" />
              {m.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-12 animate-fade-in">
              <Sparkles className="w-16 h-16 mx-auto mb-4 text-primary" />
              <h2 className="text-2xl font-bold mb-2">Welcome to Lony Chat</h2>
              <p className="text-muted-foreground">
                Your intelligent AI assistant for chat, code, images, and creative ideas
              </p>
            </div>
          )}
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="glass-effect border-t border-border/50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-2 items-end">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              accept="image/*,.pdf,.doc,.docx"
            />
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
            >
              <Paperclip className="w-5 h-5" />
            </Button>

            <VoiceRecorder
              onTranscript={handleVoiceTranscript}
              disabled={isLoading}
            />

            <div className="flex-1 flex flex-col gap-2">
              {uploadedImage && (
                <div className="relative inline-block">
                  <img
                    src={uploadedImage}
                    alt="Uploaded"
                    className="h-20 rounded-lg border border-border"
                  />
                  <button
                    onClick={() => setUploadedImage(null)}
                    className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs"
                  >
                    ×
                  </button>
                </div>
              )}
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder={`Ask Lony to ${mode === "chat" ? "chat with you" : mode === "code" ? "generate code" : mode === "image" ? "create an image" : "describe a video concept"}...`}
                className="min-h-[60px] max-h-[200px] resize-none glass-effect"
                disabled={isLoading}
              />
            </div>

            <Button
              onClick={handleSendMessage}
              disabled={isLoading || (!input.trim() && !uploadedImage)}
              className="glow-primary"
              size="icon"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
