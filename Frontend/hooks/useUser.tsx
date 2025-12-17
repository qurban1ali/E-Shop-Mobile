import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: {
    id: string;
    file_id: string;
    url: string;
  };
}

export default function useUser() {
  const [user, setUser] = useState<User>();

  //   REtrieving the stored user data

  const getUserData = async () => {
    try {
      const userString = await SecureStore.getItemAsync("user");
      if (userString) {
        const user = JSON.parse(userString);
        setUser(user);
        return user;
      }
      return null;
    } catch (error) {
      console.log("Error reterieving user data:", error);
      return null;
    }
  };

//   update user data (for avatar updates)
  const updateUserData = async (newUserData: User) => {
  try {
    await SecureStore.setItemAsync("user",JSON.stringify(newUserData))
    setUser(newUserData)
  } catch (error) {
     console.error("Error updating user Data:", error)
  }
}

   useEffect(() => {
     getUserData();
   }, []);

   return {user, updateUserData}
   
}
