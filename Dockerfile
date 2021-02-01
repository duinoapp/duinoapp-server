FROM node:10-buster

USER root
RUN useradd duino

COPY setup/index.js /home/duino/setup/index.js
COPY setup/arduino-cli.yml /home/duino/data/arduino-cli.yml
# COPY Arduino /home/duino/Arduino

# RUN mkdir /home/duino
RUN chown duino:duino /home/duino -R
RUN apt-get update && apt-get install build-essential -y

WORKDIR /home/duino
USER duino

RUN wget https://github.com/arduino/arduino-cli/releases/download/0.13.0/arduino-cli_0.13.0_Linux_64bit.tar.gz -O - | tar -xz

RUN ls


ENV CLI_ARGS="--config-file /home/duino/data/arduino-cli.yml --format json"
RUN ./arduino-cli core update-index ${CLI_ARGS}
RUN ./arduino-cli core search "" ${CLI_ARGS} > /home/duino/data/cores.json

RUN ./arduino-cli lib update-index ${CLI_ARGS}
RUN ./arduino-cli lib search "" ${CLI_ARGS} > /home/duino/data/libs.json

RUN node setup/ cores
RUN node setup/ boards

USER root
COPY package*.json /home/duino/
RUN chown duino:duino /home/duino/package*.json
RUN apt-get install nano
USER duino

RUN npm ci

USER root
COPY src /home/duino/src
RUN chown duino:duino /home/duino/src -R
RUN mkdir /data
RUN chmod 0777 /data
COPY entrypoint.sh /home/duino/
COPY load-libs.sh /home/duino/
RUN chmod +x ./*.sh
RUN chown duino:duino ./*.sh
USER duino

EXPOSE 3030
CMD [ "./entrypoint.sh" ]