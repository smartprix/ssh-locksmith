const {File, System, cfg} = require('sm-utils');
const fs = require('fs'); // required for reading directory
const nodemailer = require('nodemailer');

const authorizedKeysDir = cfg('authorizedKeysDir');

const transporter = nodemailer.createTransport({
	sendmail: true,
	newline: 'unix',
	path: '/usr/sbin/sendmail',
});

function sendMail(email, user, pathToPrivateKey) {
    transporter.sendMail({
        from: 'admin@smartprix.com',
        to: email,
        subject: `SSH Key to Login as ${user} user on the server`,
        text: `This mail has your private SSH key attached with it. You can use it to login to the server as "${user}".\n\nThe key is meant to be used by you and only you. Sharing or misusing of this key is strictly prohibited.`,
        attachments: [
            {
                path: pathToPrivateKey,
            },
        ],
    }, (err, info) => {
        // console.log(info.envelope);
        // console.log(info.messageId);
    });
}

async function addUserKeyFor(user, email) {
    // generate key pair
    System.exec(`ssh-keygen -t rsa -f newKey -C "${email}"`);

    // copy public key to authorized_keys for 
    const file = new File(`${authorizedKeysDir}/${user}`);
    const pubKey = new File('./newKey.pub');
    const priKey = new File('./newKey');

    await file.append(await pubKey.read());
    await pubKey.rm();

    // send private key to user via email
    sendMail(email, user, priKey.realpathSync);
    await priKey.rm();
}

function deleteUserKeyFor(user, email) {
    // delete authorized_keys entry in the given user for the given email
    System.exec(`sed -i '/${email}/d' ${authorizedKeysDir}/${user}`);
}

function deleteAllKeysFor(email) {
    // delete authorized_keys entries in all users for the given email
    const existingUsers = fs.readdirSync(authorizedKeysDir)

    existingUsers.forEach((user) => deleteUserKeyFor(user, email));
}

module.exports = {
    addUserKeyFor,
    deleteUserKeyFor,
    deleteAllKeysFor,
};
