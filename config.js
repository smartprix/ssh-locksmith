const os = require('os');

module.exports = {
	hostname: os.hostname(),
	authorizedKeysDir: '/etc/ssh/authorized_keys',
};
