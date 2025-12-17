import axiosInstance from "@/utils/axiosInstance";
import { useQuery } from "@tanstack/react-query";
import useUser from "@/hooks/useUser";


interface Conversation {
  conversationId: string;
  lastMessage: string;
  lastMessageAt: string;
  seller: {
    id: string;
    name: string;
    avatar: string;
    isOnline: boolean
  };
  unreadCount: number;
}
export const useUnreadMessages = () => {
  const { user } = useUser();
  //@ts-ignore
  const userId = user?._id || user?.id;

 const { data: conversations } = useQuery<Conversation[]>({
  enabled: !!userId,
  queryKey: ["conversations", userId],

  queryFn: async () => {
    const res = await axiosInstance.get(
      `/api/v2/conversation/get-all-conversation-user/${userId}`
    );
    return res.data.conversations;
  },

  refetchInterval: 3000, // ✅ Poll backend every 3 seconds
});


  const totalUnread = (conversations ?? []).reduce(
    (total, conv) => total + (conv.unreadCount || 0),
    0
  );

  return { conversations, totalUnread };
};


// export const useUnreadMessages = () => {
//   const { data: conversations } = useQuery<Conversation[]>({
//     queryKey: ["conversations"],
//     queryFn: async () => {
//       const res = await axiosInstance.get(
//         "/chatting/api/get-user-conversations"
//       );
//       return res.data.conversations;
//     },
//   });

//   // 💡 FIX: Use nullish coalescing (??) to default conversations to an empty array
//   // This ensures 'totalUnread' is always calculated, resulting in 0 if conversations is undefined/null.
//   const totalUnread = (conversations ?? []).reduce(
//   (total: number, conv: Conversation) => total + (conv.unreadCount || 0),
//     0
//   );

//   // totalUnread is now guaranteed to be 'number' (0 or greater).
//   return { conversations, totalUnread };
// };