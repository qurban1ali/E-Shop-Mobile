"use client";
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

const WebSocketContext = createContext<any>(null);

export const WebSocketProvider = ({
  children,
  user,
}: {
  children: React.ReactNode;
  user: any;
}) => {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const userId = user?._id || user?.id;
    if (!userId) return;

    const uri =
      process.env.EXPO_PUBLIC_CHATTING_WEBSOCKET_URI || "ws://localhost:6006";

    console.log("WebSocketProvider: connecting to", uri, "for user", userId);

    const socket = new WebSocket(uri);
    setWs(socket);

    const onOpen = () => {
      console.log("WebSocket: open");
      // identify with backend using consistent id field
      try {
        socket.send(JSON.stringify({ type: "IDENTIFY", userId }));
        console.log("WebSocket: IDENTIFY sent", { userId });
      } catch (err) {
        console.error("WebSocket: failed to send IDENTIFY", err);
      }
    };

    const onMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        console.log("WebSocket: incoming message", data);

        if (data.type === "UNSEEN_COUNT_UPDATE") {
          const { conversationId, count } = data.payload;
          setUnreadCounts((prev) => ({ ...prev, [conversationId]: count }));
        }
      } catch (err) {
        console.error("WebSocket: parse error in provider", err);
      }
    };

    const onError = (err: any) => console.error("WebSocket: error", err);
    const onClose = (ev: any) => console.log("WebSocket: closed", ev?.code, ev?.reason);

    socket.addEventListener("open", onOpen);
    socket.addEventListener("message", onMessage);
    socket.addEventListener("error", onError);
    socket.addEventListener("close", onClose);

    return () => {
      try {
        socket.removeEventListener("open", onOpen);
        socket.removeEventListener("message", onMessage);
        socket.removeEventListener("error", onError);
        socket.removeEventListener("close", onClose);
        socket.close();
      } catch (err) {
        /* ignore */
      }
      setWs(null);
    };
  }, [user?._id, user?.id]);

  return (
    <WebSocketContext.Provider value={{ ws, unreadCounts }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => useContext(WebSocketContext);
