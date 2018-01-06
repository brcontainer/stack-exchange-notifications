## Installing StackExchangeNotifications

- Opera: https://addons.opera.com/en/extensions/details/stackexchange-notifications/
- Firefox: https://addons.mozilla.org/en-US/firefox/addon/stackexchangenotifications/

> **Note:** requires Firefox 48+, extension uses [`web_accessible_resources`](https://developer.mozilla.org/en-US/Add-ons/WebExtensions/manifest.json/web_accessible_resources) only supported in 48 version

## About StackExchangeNotifications

![preview](http://i.stack.imgur.com/EM13u.png)

This extension has been created for you to stay connected on their StackExchange sites when you're doing other activities:

- Notifies you of new messages in "inbox"
- Notifies you when your achievements change (downvotes, upvotes, badges)
- Quick read of "inbox"
- Quick read of "achievements"

## StackExchangeNotifications screenshots

- Inbox: [Inbox](http://i.stack.imgur.com/6FS0H.png)

- Achievements and score: [Achievements/score/badges](http://i.stack.imgur.com/2LqNo.png)

![inbox and achievements in your browser](http://i.stack.imgur.com/YgDIV.png)

## For developers

For debugging or testing push notifications there are some functions:

| Function | Description |
| --- | --- |
| `.setAchievements(int achievements [, int score])` | Use integers in two parameters |
| `.setInbox(int msgs)` | Use integers, may be 0, 1 or higher |
| `.update()` | After use `setAchievements` and/or `setInbox`, perform this function, this function show results in "push notifications" over icon and pop-up tabs |
| `.getAchievements()` | Get current total achievements, return a object like `{score: int, acquired: int}` |
| `.hasCache()` | Return `true` if has cache or `false` if no |
| `.clearCache([, type])` | Clear inbox and achievements cache, if first parameter empty clear cache from inbox and achivements, or specific inbox and achievements in first parameter |
| `.meta()` | Get appname and version, return object like this `{appname: string, version: string}` |
| `.getInbox()` | Get total messages in Inbox, return `int` |

### Debugging in Opera or Chrome

- Click with right mouse button, and select "Inspect pop-up"
- Go to Console tab in "Developer Tools" and type your commands

(More details: https://developer.chrome.com/extensions/tut_debugging)

### Debugging in Firefox

> **Note:** Requires Firefox 48+ (or Developer Edition) for load of temporary add-on

- Type `about:debugging` in "address bar"
- Click in "Load Temporary Add-on"
- Go to chrome folder (from this project) and select `background.js`
- After add-on is showed, click on "Debug" button (on right extension)
- In Console tab type your commands

(More details: https://developer.mozilla.org/en-US/docs/Tools/about:debugging)

### Examples

Show fake new score:

```javascript
StackExchangeNotifications.setAchievements(300);
StackExchangeNotifications.update();
```

Show fake new badges or privileges:

```javascript
StackExchangeNotifications.setAchievements(-1, 800);
StackExchangeNotifications.update();
```

Show fake new achievements score, badges and privileges:

```javascript
StackExchangeNotifications.setAchievements(20, 800);
StackExchangeNotifications.update();
```

Show fake new messages in Inbox:

```javascript
StackExchangeNotifications.setInbox(981);
StackExchangeNotifications.update();
```

Two commands simultaneously:

```javascript
StackExchangeNotifications.setAchievements(10, 300);
StackExchangeNotifications.setInbox(981);
StackExchangeNotifications.update();
```
