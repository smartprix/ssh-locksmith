## SSH Locksmith
A node utility to manage **SSH keys** for different users on the server. It allows you to add and delete different users on your server.

It generates an SSH key pair and adds the public key to the `authorized_keys` directory and sends the private key via e-mail to the e-mail id provided.

You can delete the keys for a particular user, or for a particular e-mail address. The e-mail address is used as a comment while generating the SSH key pair, thus deletion on the basis of e-mail address is also supported.