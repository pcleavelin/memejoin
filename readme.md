# MemeJoin Discord Bot
This bot will play a customizable sound bite when a person joins a voice channel.

You will need to create an `auth.json` and `settings.json` beside `bot.js`

## Sound Files
Just create a sounds folder next to bot.js and put them in there.

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
You will need to install [node](https://nodejs.org/en/) version 10 and [yarn](https://yarnpkg.com).
If you're on Windows, you'll have to install [ffmpeg](https://ffmpeg.org/) and through yarn you need to install `windows-build-tools`:

```yarn global add windows-build-tools```

On linux, just install ffmpeg through your distro's package manager.

After installing those, just run `yarn` to install the dependencies of the bot, and finally run `node bot.js`

If you run into any problems just create an issue on this repo.

## Potential Issues
Not the most tidy code, I maybe missed some error checking in a few edge cases, but for the most part it works. :P

If multiple people join a voice channel at the same time, weird things could happen. Will fix later. Maybe. Sometime...
