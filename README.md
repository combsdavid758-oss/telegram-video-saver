# Telegram Video Saver

A Chrome Manifest V3 extension that attempts to download the current video from your authenticated Telegram Web session, including channels where the save button is disabled. It reads the visible video's source; it does not require Telegram API credentials or send data to a third party.

## Install
1. Extract the ZIP into a permanent folder.
2. Open `chrome://extensions` and turn on **Developer mode**.
3. Choose **Load unpacked** and select the folder containing `manifest.json`.
4. Open https://web.telegram.org/k/ or https://web.telegram.org/a/ and sign in normally.
5. Open a video, start playback, click this extension, and choose **Save open video**.
6. Keep the Telegram tab open. Progress and errors appear in the lower-right corner; click the notice to dismiss it.

## Compatibility and limits
This is a source-based downloader, not a guarantee of compatibility with every Telegram video. It supports same-origin HTTPS video endpoints (including validated byte-range responses) and complete Blob video URLs. Telegram's MediaSource-only players, DRM/encrypted media, secret chats unavailable in Web, and videos exceeding 1 GB are unsupported. Try the other Web client when a MediaSource error appears. The largest visible playing video is selected; pause other videos to avoid selecting the wrong one.

The complete video is buffered in memory before saving. Large videos can use substantial memory. Reloading or closing the Telegram tab cancels the operation. Chrome's download settings determine whether it asks for a destination. Output filenames are generated locally.

## Privacy
Only `activeTab` and `scripting` permissions. Code runs only after clicking Save on web.telegram.org. No analytics, remote code, login-token extraction, or third-party servers. Use with content you have permission to save.

## Verification
JavaScript syntax and simulated download flows are checked. Chromium integration checks also verify downloading and joining byte ranges served by a local service worker, including repeated saves. Live authenticated Telegram playback has not been tested; Telegram can change its player implementation.

## Version 1.0.1
Video requests now run in Telegram's page execution world so its service worker can handle virtual media URLs. Range requests use 512 KB chunks for Web K compatibility. After updating the unpacked extension, click Reload in chrome://extensions and refresh the Telegram tab. No additional permissions are needed.
