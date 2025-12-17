// src/config/Providers.tsx
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner-native";
import useUser from "@/hooks/useUser";
import { WebSocketProvider } from "@/context/web-socket.context";
import { ConversationProvider } from "@/context/conversation.context";

const queryClient = new QueryClient();

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ProvidersWithWebSocket>
        {children}
        <Toaster
          position="top-center" // ← THIS FIXES THE TYPE ERROR
          closeButton
          duration={5000}
          richColors
        />
      </ProvidersWithWebSocket>
    </QueryClientProvider>
  );
}

const ProvidersWithWebSocket = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { user } = useUser();

  return (
    <>
      {user && (
        <WebSocketProvider user={user}>
          <ConversationProvider>{children}</ConversationProvider>
        </WebSocketProvider>
      )}
      {!user && <ConversationProvider>{children}</ConversationProvider>}
    </>
  );
};
