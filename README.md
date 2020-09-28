# duino.app Docker Compile Server
## aka Chromeduino 3.0

This server acts as an interface between the duino.app client and the arduino-cli.

The main purpose of this is to let arduino-cli handle most of the code compiling work.

The main update made in 3.0 is the websocket interface, which gives real-time communication with
the client, allowing us to proxy the serial connection to the device for uploading.

It's important to note that this server is bundled using docker with **All** the libraries installed,
this allows anyone to use any library they desire by simply including it. The down side of this is
that the servers docker-bundle size is several gigabytes in size.

## Installing a local compile server

**Warning:** The server download is serveral gigabytes in size, initial installation will take a while.

1. Make sure [docker is installed.](https://docs.docker.com/engine/install/)
2. run `docker run -p 3030:3030 --restart always -d duinoapp/duinoapp-server:latest`

The compile server will be available at `http://localhost:3030`

## Making a server accessable remotely

If you've installed this on an existing server, just setup a reverse proxy to `http://localhost:3030`.

Alternatively, you can setup this on a fresh server by following [these instructions.](link)

If you have no clue what I'm talking about, reachout for help.
