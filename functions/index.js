const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

exports.sendNewMessageNotification = functions.firestore
    .document("chats/{chatId}/Messages/{messageId}")
    .onCreate(async (snap, context) => {
      const message = snap.data();
      const chatId = context.params.chatId;

      // Get chat document to find participants
      const chatDoc = await admin
          .firestore()
          .collection("chats")
          .doc(chatId)
          .get();
      const chatData = chatDoc.data();
      if (!chatData) return;

      // Find recipient(s) (exclude sender)
      const recipients = chatData.participants.filter(
          (uid) => `/Users/${uid}` !== message.senderRef,
      );

      // Get FCM tokens for recipients
      const tokens = [];
      for (const uid of recipients) {
        const userDoc = await admin
            .firestore()
            .collection("Users")
            .doc(uid)
            .get();
        if (userDoc.exists && userDoc.data().fcmToken) {
          tokens.push(userDoc.data().fcmToken);
        }
      }

      if (tokens.length === 0) return;

      // Send notification
      const payload = {
        notification: {
          title: "New Message",
          body: message.content,
          click_action: "FLUTTER_NOTIFICATION_CLICK",
        },
        data: {
          chatId,
        },
      };

      await admin.messaging().sendToDevice(tokens, payload);
    });

