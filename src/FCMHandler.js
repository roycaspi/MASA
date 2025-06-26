import { useEffect } from "react";
import { useAuth } from "./contexts/AuthContext";
import { requestAndSaveFcmToken, listenForMessages } from "./fcm";

export default function FCMHandler() {
  const { currentUser } = useAuth();
  useEffect(() => {
    let isMounted = true;
    if (currentUser) {
      requestAndSaveFcmToken(currentUser.uid);
      listenForMessages((payload) => {
        if (isMounted) {
          console.log("Received foreground message: ", payload);
        }
      });
    }
    return () => { isMounted = false; };
  }, [currentUser]);
  return null;
} 