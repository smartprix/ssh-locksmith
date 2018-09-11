const {File, System, cfg, Vachan} = require('sm-utils');
const fs = require('fs'); // required for reading directory
const nodemailer = require('nodemailer');

const authorizedKeysDir = cfg('authorizedKeysDir');

const transporter = nodemailer.createTransport({
	sendmail: true,
	newline: 'unix',
	path: '/usr/sbin/sendmail',
});

async function sendMail(email, user, pathToPrivateKey) {
    return transporter.sendMail({
        from: 'admin@smartprix.com',
        to: email,
        subject: `SSH Key to Login as ${user} user on ${cfg('hostname')}`,
        text: `This mail has your private SSH key attached with it. You can use it to login to ${cfg('hostname')} as "${user}".\n\nThe key is meant to be used by you and only you. Sharing or misusing of this key is strictly prohibited.`,
        attachments: [
            {
                path: pathToPrivateKey,
            },
        ],
    });
}

async function addUserKeyFor(user, email) {
    const keyName = `${cfg('hostname', 'server')}_${user}`;
    await new File(`./${keyName}.pub`).rmrf();
    await new File(`./${keyName}`).rmrf();

    // generate key pair
    await System.exec(`ssh-keygen -t rsa -f ${keyName} -C "${email}" -N ""`);
    console.log('New key pair generated');

    // copy public key to authorized_keys for 
    const file = new File(`${authorizedKeysDir}/${user}`);
    const pubKey = new File(`./${keyName}.pub`);
    const priKey = new File(`./${keyName}`);

    await file.append(await pubKey.read());
    console.log('Added key for user', user);
    await pubKey.rm();

    // send private key to user via email
    await sendMail(email, user, priKey.realpathSync());
    console.log('Sent mail to email', email);
    await priKey.rm();
}

async function deleteUserKeyFor(user, email) {
    // delete authorized_keys entry in the given user for the given email
    await System.exec(`sed -i '/${email}/d' ${authorizedKeysDir}/${user}`);
    console.log(`Deleted keys for ${user} associated with ${email}`)
}

async function deleteAllKeysFor(email) {
    // delete authorized_keys entries in all users for the given email
    const existingUsers = fs.readdirSync(authorizedKeysDir)

    return Vachan.promiseMap(existingUsers, async (user) => deleteUserKeyFor(user, email));
    console.log(`Deleted all keys associated with ${email}`)
}

module.exports = {
    addUserKeyFor,
    deleteUserKeyFor,
    deleteAllKeysFor,
};
