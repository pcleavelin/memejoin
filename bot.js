var Discord = require('discord.js');
var winston = require('winston');
var ytdl = require('ytdl-core');
var auth = require('./auth.json');
var settings = require('./settings.json');

var logger = winston.createLogger({
	level: 'debug',
	format: winston.format.json(),
	transports: [
		new winston.transports.File({ filename: 'logs/error.log', level: 'error'}),
		new winston.transports.File({ filename: 'logs/combined.log'})
	]
});

if(!logger || typeof logger == undefined || logger == null) {
	console.error('Failed to create logger');
	process.exit();
}

if(process.env.NODE_ENV !== 'production') {
	logger.add(new winston.transports.Console({
		colorize: true,
		format: winston.format.simple()
	}));
}

logger.info(`Creating Discord client with token '${auth.token}'`);

var client = new Discord.Client();

if(!client || typeof client == undefined || client == null) {
	logger.error('Failed to create Discord client');
	process.exit();
}

if(client.connected == false) {
	logger.error('Failed to connect to Discord');
	process.exit();
}

client.on('ready', () => {
	logger.info('Connected');
	logger.info(`Logged in as ${client.user.username}`);
	return;
});

client.on('message', msg => {
	if(msg.content === '!do_voice') {
		doUserEnter(msg.member);
	}

	if(msg.content === '!leave_voice') {
		leaveVoiceChannel(msg.member);
	}
});

client.on('voiceStateUpdate', (oldMember, newMember) => {
	let name = newMember.displayName;

	if(name === client.user.username) {
		return;
	}

	let oldVC = oldMember.voiceChannel;
	let newVC = newMember.voiceChannel;

	// This event gets triggered when ther user does anything in a voice channel
	// so we want to make sure we only trigger this piece of code when they enter or leave a channel
	if(oldVC !== newVC) {
		// Check if user is leaving the voice channel
		if(oldVC !== null && typeof oldVC !== 'undefined') {
			let m = oldVC.members.find(m => m.displayName === name);

			// Check if the user actually left the channel
			if(m === null || typeof m === 'undefined') {
				logger.info(`${name} left voice channel ${oldVC.name}`)
				oldVC.leave();
				logger.info(`Left from ${oldVC.name}`);
			}
		}

		// Check if user is entering the voice channel
		if(newVC !== null && typeof newVC !== 'undefined') {

			// Check if the user is actually in the channel
			let m = newVC.members.find(m => m.displayName === name);
			if(m !== null && typeof m !== 'undefined') {
				doUserEnter(m);
			}
		}
	}
});

function doUserEnter(member) {
	tryJoinUserVoiceChannel(member)
		.then(con => {
			logger.info(`Connected with ${member.displayName}`);

			// Have a delay before sending audio to makek sure the bot is fully connected first
			setTimeout(() => {
					playUserEnteredNoise(con, con.channel.name, member.displayName);

					// Leave after attempting to play sound
					// newVC.leave();
				}, settings.userEnteredSoundDelay)
		})
		.catch(error => logger.error('Failed to join voice channel: ' + error));
}

function tryJoinUserVoiceChannel(member) {
	const vc = member.voiceChannel;
	const name = member.displayName;

	// Check if user is entering the voice channel
	if(vc !== null && typeof vc !== 'undefined') {
		let m = vc.members.find(m => m.displayName === name);
		if(m !== null && typeof m !== 'undefined') {
			// Return promise generated by .join()
			return vc.join();
		} else {
			return Promise.reject(new Error(`Couldn't find ${name} in ${vc.name}`));
		}
	}

	return Promise.reject(new Error(`Couldn't find ${name} in a voice channel`));
}

function leaveVoiceChannel(member) {
	const vc = member.voiceChannel;
	const name = member.displayName;

	// Check if user is entering the voice channel
	if(vc !== null && typeof vc !== 'undefined') {
		let m = vc.members.find(m => m.displayName === name);
		if(m !== null && typeof m !== 'undefined') {
			vc.leave();
			logger.info(`Left voice channel of ${member.displayName}`);
		}
	}
}

function playUserEnteredNoise(con, channelName, name) {
	const chan_setting = settings.channels[channelName];
	if(chan_setting === null || typeof chan_setting === 'undefined' ||
		chan_setting.enterUsers === null || typeof chan_setting.enterUsers === 'undefined' ||
		chan_setting.enterUsers[name] === null || typeof chan_setting.enterUsers[name] === 'undefined')
	{
		logger.info(`No UserEnteredNoise for ${name} in channel ${channelName}`);
		return;
	}

	let enterSoundPath = chan_setting.enterUsers[name].enterSound;
	if(enterSoundPath === null || typeof enterSoundPath === 'undefined') {
		logger.error(`No path to enter sound for user ${name} in channel ${channelName}`);
		return;
	}

	let type = chan_setting.enterUsers[name].type;
	if(type === null || typeof type === 'undefined') {
		logger.error(`No type defined for enterSound for user ${name} in voice channel ${channelName}`);
	} 
	// Play audio from a youtube video
	else if(type.toLowerCase() === 'youtube') {
		const stream = ytdl(enterSoundPath, {
			filter: 'audioonly'
		});
		con.playStream(stream, {
			seek: 0,
			volume: !!settings.youtubeVolume ? settings.youtubeVolume : 0.25
		});
	} else if(type.toLowerCase() === 'file') {
		con.playFile(`./sounds/${enterSoundPath}`);
	} else {
		logger.error(`Invalid type '${type}' defined for enterSound for user ${name} in voice channel ${channelName}`);
	}

	// Attempt to play sound in voice channel
	// const broadcast = client.createVoiceBroadcast();
	// broadcast.playFile(`./sounds/${enterSoundPath}`);
	// con.playBroadcast(broadcast);
}

client.login(auth.token);