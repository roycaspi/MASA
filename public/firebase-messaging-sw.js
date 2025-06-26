importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// NOTE: Service workers cannot access process.env directly. Replace these values at build time or use a build tool to inject them.
// Example replacement:
// firebase.initializeApp({
//   apiKey: "your_api_key",
//   authDomain: "your_auth_domain",
//   projectId: "your_project_id",
//   messagingSenderId: "your_messaging_sender_id",
//   appId: "your_app_id",
// });

firebase.initializeApp({
  apiKey: "REPLACE_WITH_YOUR_API_KEY",
  authDomain: "REPLACE_WITH_YOUR_AUTH_DOMAIN",
  projectId: "REPLACE_WITH_YOUR_PROJECT_ID",
  messagingSenderId: "REPLACE_WITH_YOUR_MESSAGING_SENDER_ID",
  appId: "REPLACE_WITH_YOUR_APP_ID"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  self.registration.showNotification(
    payload.notification.title,
    {
      body: payload.notification.body,
      icon: '/logo192.png',
      data: payload.data
    }
  );
}); 