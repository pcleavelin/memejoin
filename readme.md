# MemeJoin Discord Bot
This bot will play a customizable sound bite when a person joins a voice channel.

You will need to create an `auth.json` and `settings.json` beside `bot.js`

## Sound Files
Currently mp3 files don't work too well. You're better of just finding a youtube video of your sound or uploading your own. Eventually I'll see what the issue is. But if you /really/ want to use mp3s, just create a sounds folder next to bot.js and put them in there.

## Example of `auth.json`
```
{
  "token": "MyDiscordBotToken"
}
```

## Example of `settings.json`
```
{
	"userEnteredSoundDelay": 100,
	"channels": {
		"MyTotallyAwesomeVoiceChannelName": {
			"enterUsers": {
				"user1": {
					"type": "youtube",
					"enterSound": "https://www.youtube.com/watch?v=x7KK7bXJV2c"
				},
				"user2": {
					"type": "file",
					"enterSound": "mySound.mp3"
				}
			}
		}
	}
}
```

## Running
You will need to install [node]("https://nodejs.org/en/") version 10 and npm (they are usually packaged together).
If you're on Windows, you'll have to install [ffmpeg]("https://ffmpeg.org/") and through npm you need to install `windows-build-tools`
```npm install --global --production windows-build-tools```

On linux, just install ffmpeg through your distro's package manager.

After install those, just run `npm install` to install the dependencies of the bot, and finally run `node bot.js`

If you run into any problems just create an issue on this repo.