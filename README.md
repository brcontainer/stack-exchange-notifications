# Install

- Opera: https://addons.opera.com/en/extensions/details/stackexchange-notifications/
- Firefox: https://addons.mozilla.org/en-US/firefox/addon/stackexchangenotifications/

# About

![preview](http://i.stack.imgur.com/EM13u.png)

This extension has been created for you to stay connected on their StackExchange sites when you're doing other activities:

- Notifies you of new messages in "inbox"
- Notifies you when your achivements change (downvotes, upvotes, badges)
- Quick read of "inbox"
- Quick read of "achievements"

# Screenshots

- Inbox: [Inbox](http://i.stack.imgur.com/6FS0H.png)

- Achivements and score: [Achivements/score](http://i.stack.imgur.com/2LqNo.png)

![inbox and achivements in your browser](http://i.stack.imgur.com/YgDIV.png)

# For developers

For debugging or testing push notifications there are some functions:

| Function | Description |
| --- | --- |
| `StackExchangeNotifications.setAchievements` | Use integers |
| `StackExchangeNotifications.setInbox` | Use integers, may be 0, 1 or higher |
| `StackExchangeNotifications.update` | After use setAchievements and/or setInbox, perfom this function, this function show results in "push notifications" over icon and popup tabs |
| `StackExchangeNotifications.getAchievements` | Get current total achivements |
| `StackExchangeNotifications.getInbox` | Get total messages in Inbox |

## Debugging in Opera or Chrome

- Click with right mouse button, and select "Inspect pop-up"
- Go to Console tab in "Developer Tools" and type your commands

(More details: https://developer.chrome.com/extensions/tut_debugging)

## Debugging in Firefox

**Note:** Requires Firefox 48 (or Developer Edition) for load of temporary add-on

- Type `about:debugging` in Addressbar
- Click in "Load Temporary Addon"
- Go to chrome folder (from this project) and select background.js
- After addon is showed, click on "Debug" button (on right extension)
- In Console tab type your commands

(More details: https://developer.mozilla.org/en-US/docs/Tools/about:debugging)

## Examples

Show fake new achivements:

```javascript
StackExchangeNotifications.setAchievements(1000);
StackExchangeNotifications.update();
```

Show fake new messages in Inbox:

```javascript
StackExchangeNotifications.setInbox(981);
StackExchangeNotifications.update();
```

Two commands simultaneously:

```javascript
StackExchangeNotifications.setAchievements(1000);
StackExchangeNotifications.setInbox(981);
StackExchangeNotifications.update();
```
