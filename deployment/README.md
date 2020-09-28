# Remote deployment

Theses are some files to help make deploying on a remote server easier.
This assumes a fresh VPS with Ubuntu 20 +, that is only going to be used as
a compile server. A minimum of 20GB of storage is required.

VPS = Virtual Private Server

1. Create the VPS, Digital Ocean droplets are usually good for beginners (cheapest will do)
2. Point your subdomain to the VPS (this will be an A record with the VPS's public IP)
3. SSH into the VPS, you can usually do this from the Digital Ocean web interface.
4. Run the command `<insert command here>` (This will take a while)
5. Run the command `nano docker-compose.yml`
6. Edit the content of the file where indicated, you should enter details like the domain, subdomain, email, server info
7. When done editing, press `Ctl+X`, `Y`, and then `Enter`
8. Run `docker-compose up -d`

The server should now be available on your subdomain.

## I Have No Clue What You Just Said

That's ok. Feel free to reach out. If you want to add a new public compile server, we can help you with everything.
