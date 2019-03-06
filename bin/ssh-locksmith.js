const {cfg} = require('sm-utils');
const commandLineCommands = require('command-line-commands');
const commandLineArgs = require('command-line-args');
const commandLineUsage = require('command-line-usage');

const {version} = require('../package.json');

const confFile = process.env.SSH_LOCKSMITH_CONFIG;

cfg.file(`${__dirname}/../config.js`, {overwrite: true});
cfg.file(`${__dirname}/../private/config.js`, {ignoreNotFound: true});

if (confFile) {
	cfg.file(confFile, {ignoreNotFound: true});
}

const operations = require('../index');

const validCommands = [null, 'help', 'add', 'del'];
const {command, argv} = commandLineCommands(validCommands);

const optionDefinitions = [
	{
		name: 'user',
		type: String,
		description: 'The remote user for which authorized key needs to be added.',
		group: ['add', 'del'],
	}, {
		name: 'email',
		type: String,
		description: 'The email address which will be/was used as comment in the SSH key entry in the authorized keys. In case the command is {bold add}, the private key will also be sent to this email address.',
		group: ['add', 'del'],
	}, {
		name: 'all',
		type: Boolean,
		defaultValue: false,
		description: 'If this option is set, then SSH keys for all users on the server related to {italic EMAIL} will be deleted.',
		group: ['del'],
	},
];

const sections = [
	{
		header: 'SSH Locksmith',
		content: 'A node utility to manage {bold SSH keys} for different users on the server',
	},
	{
		header: 'version',
		content: `v${version}`,
	},
	{
		header: 'Synopsis',
		content: '$ ssh_locksmith <command> [options...]',
	},
	{
		header: 'Command List',
		content: [
			{
				name: 'help',
				summary: 'Displays help information about ssh_locksmith.',
			},
			{
				name: 'add [--user USER --email EMAIL]',
				summary: 'Add an SSH key to the authorized keys for user {italic USER}, and mail corresponding private key to {italic EMAIL}',
			},
			{
				name: 'del [--user USER --email EMAIL --all]',
				summary: 'Deletes SSH key entries with {italic EMAIL} as comment',
			},
		],
	},
	{
		header: 'Options List',
		optionList: optionDefinitions,
	},
];
const usage = commandLineUsage(sections);
let options = commandLineArgs(optionDefinitions, {argv});

// let res;

async function performCommand(com) {
	try {
		switch (com) {
			case 'add':
				options = options.add;
				if (!options.user || !options.email) {
					console.error('Email/User not provided (required)');
				}
				else {
					await operations.addUserKeyFor(options.user, options.email)
				}
				break;

			case 'del':
				options = options.del;
				if (!options.email) {
					console.error('Email not provided (required)');
				}
				else if (options.all) await operations.deleteAllKeysFor(options.email);
				else {
					if (!options.user) console.error('User not provided (required)');
					else await operations.deleteUserKeyFor(options.user, options.email);
				}
				break;

			default:
				console.log(usage);
				break;
		}
	}
	catch (err) {
		console.error(err);
	}
}

performCommand(command);
