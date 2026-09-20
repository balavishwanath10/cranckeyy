# cranckeyy 🔐

> Exclusive 1-on-1 private real-time messaging application with 60-second rotating OTP authenticator, 20-minute inactivity auto-lock, 1-hour session segmentation, customizable dual-color themes, and cross-platform PWA compatibility (PC & mobile).

---

## ⚡ Key Features

1. **Email OR Mobile Number Authentication**:
   - Log in using either your **Email Address** (e.g. `alex@cranckeyy.com`) OR **Mobile Number** (e.g. `+91 94940 00001`).
   - The 6-digit OTP code is sent directly to the entered email or mobile number via SMS.
   - **No 60-Second Reloading**: Uses standard, secure OTP expiration (10 minutes) with a convenient "Resend OTP" button.

2. **Session Expiry & Inactivity Auto-Resend**:
   - If the app is inactive for 20 minutes (or a session expires), the app automatically sends a **fresh OTP** to the registered mobile or email.
   - The user inputs the fresh code to unlock and resume their conversation.

3. **Strict 1-on-1 Pairing (Person 2)**:
   - New users enter Person 2's email or phone number to lock in their permanent pair.
   - Returning users with an established connection only need to enter their OTP!

3. **1-Hour Session Segmentation (Sessions Archive)**:
   - Chats are tracked as active sessions as long as the participants are messaging.
   - After a minimum of **1 hour of inactivity**, the session automatically seals and archives.
   - When a new message is sent, a fresh session starts seamlessly.
   - All past sessions are stored and can be revisited anytime inside the **Sessions Archive** in the Settings menu.

4. **Edge-to-Edge Distraction-Free Canvas**:
   - Clean messaging layout without screen clutter, optimized for both desktop browsers (Brave, Chrome, Safari, Edge) and mobile smartphones.
   - Receiver messages aligned to the **LEFT**.
   - Sender messages aligned to the **RIGHT**.

5. **Top-Right 1-Click Theme Switcher**:
   - Switch anytime with a single click between 3 distinct themes:
     - **Swiss Monochrome**: Brutalist-clean, high-contrast black & white.
     - **Nordic Ambient Glass**: Soft frosted glass (`backdrop-filter`) with smooth pill geometry.
     - **Cyber-Tactile**: Micro-dot grid with technical monospace accents and card styling.
   - Refined **Dark Mode** and **Light Mode** toggles.

6. **Settings Dropdown Hub & Customization**:
   - Clicking the **Settings** icon reveals a clean vertical dropdown menu displaying each action button sequentially:
     - 🖼️ **Change Wallpaper**: Directly select any photo from your device gallery, camera roll, or file explorer as the chat background.
     - ⏱️ **Sessions Archive**: Browse and read past 1-hour sealed sessions.
     - 💎 **Bubble Colors**: Independent color pickers for **(1) Message Box Background/Border** and **(2) Message Text Color** with live preview.
     - 👤 **Custom Profiles**: Edit display names, avatars, and nicknames for both yourself and your partner.
     - 🔐 **Authenticator OTP**: View current 60s rotating code and pair status.
     - 🔔 **Notifications**: Toggle web push alerts and message sound chimes.

7. **Rich Message Interactions**:
   - **Swipe-to-Reply**: Touch drag on mobile or click "Reply" to quote a message.
   - **Edit Message**: Messages can be edited within 15 minutes of being sent, displaying an `(edited)` indicator.
   - **Emoji Reactions**: React with emojis (❤️, 🔥, 👍, etc.) with micro-confetti feedback.
   - **Copy Message**: One-click copy with visual confirmation.
   - **Media Attachments**: Send photos, audio notes, and attachments.
   - **Redesigned Send Button**: Ergonomic pill button with directional arrow and active press states.

---

## 🚀 Getting Started

### 1. Launch the Application

From the project root:
```bash
# Start the full-stack application (Server + Client)
npm start
```
The application will be accessible at:
👉 **`http://localhost:5000`**

### 2. Run Automated Verification Tests
```bash
npm test
```
All 8 test suites will execute, validating OTP generation, verification, WebSocket messaging, 15-minute edit restriction, emoji reactions, profiles, and 2-color bubble settings.

### 3. Quick Pair Credentials (For Testing)
- **Person 1**: `+919494000001`
- **Person 2**: `+919494000002`
*(Use the convenient quick-pair buttons on the login screen to test in two separate browser tabs or windows).*
