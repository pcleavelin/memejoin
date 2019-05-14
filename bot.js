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

	// ch_settings.name different now
	// for(let ch_settings of settings.channels) {
	// 	let ch = client.channels.find(val => val.name === ch_settings.name);
	// 	if(ch === null || typeof ch === 'undefined') {
	// 		logger.error(`Couldn't find channel ${ch_settings.name}`);
	// 	} else if(ch.type === 'text') {
	// 		ch.send(ch_settings.readyMessage)
	// 			.catch(error => logger.error('Failed to send message to channel ' + error));
	// 	}
	// }

	// logger.info('Available channels: ');
	// for(let ch of client.channels) {
	// 	logger.info(`Id: ${ch[1].id}, Name: ${ch[1].name}, Type: ${ch[1].type}`);
	// }
});

client.on('message', msg => {
	if(msg.content === '!do_voice') {
		tryJoinUserVoiceChannel(msg.member).then(con => {
				logger.info(`Connected with ${msg.member.displayName}`);
				setTimeout(() => {
						playUserEnteredNoise(con, con.channel.name, msg.member.displayName);

						// Leave after attempting to play sound
						// newVC.leave();
					}, settings.userEnteredSoundDelay)
			})
			.catch(error => logger.error('Failed to join voice channel: ' + error));
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

	if(oldVC !== newVC) {
		// Check if user is leaving the voice channel
		if(oldVC !== null && typeof oldVC !== 'undefined') {
			let m = oldVC.members.find(m => m.displayName === name);
			if(m === null || typeof m === 'undefined') {
				logger.info(`${name} left voice channel ${oldVC.name}`)
				oldVC.leave();
				logger.info(`Left from ${oldVC.name}`);
			}
		}

		// Check if user is entering the voice channel
		if(newVC !== null && typeof newVC !== 'undefined') {
			let m = newVC.members.find(m => m.displayName === name);
			if(m !== null && typeof m !== 'undefined') {
				logger.info(`${name} entered voice channel ${newVC.name}`)
				newVC.join()
					.then(con => {
						logger.info(`Connected to ${newVC.name}`);

						setTimeout(() => {
							playUserEnteredNoise(con, newVC.name, name);

							// Leave after attempting to play sound
							// newVC.leave();
						}, settings.userEnteredSoundDelay)

					})
					.catch(error => logger.error('Failed to join voice channel: ' + error));
			}
		}
	}
});

function tryJoinUserVoiceChannel(member) {
	const vc = member.voiceChannel;
	const name = member.displayName;

	// Check if user is entering the voice channel
	if(vc !== null && typeof vc !== 'undefined') {
		let m = vc.members.find(m => m.displayName === name);
		if(m !== null && typeof m !== 'undefined') {
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
	} else if(type.toLowerCase() === 'youtube') {
		const stream = ytdl(enterSoundPath, {
			filter: 'audioonly'
		});
		con.playStream(stream, {
			seek: 0,
			volume: 0.25
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

	// con.playFile(`./sounds/${enterSoundPath}`);
}

client.login(auth.token);