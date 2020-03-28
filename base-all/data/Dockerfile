FROM node:10-buster

USER root
RUN useradd duino

COPY setup /home/duino/setup
COPY data /home/duino/data
# COPY Arduino /home/duino/Arduino

RUN chown duino:duino /home/duino -R
RUN apt-get update && apt-get install build-essential

WORKDIR /home/duino
USER duino

RUN wget https://github.com/arduino/arduino-cli/releases/download/0.9.0/arduino-cli_0.9.0_Linux_64bit.tar.gz -O - | tar -xz

RUN ls

ENV CLI_ARGS="--config-file /home/duino/data/arduino-cli.yml --format json"
RUN ./arduino-cli core update-index ${CLI_ARGS}
RUN ./arduino-cli core search "" ${CLI_ARGS} > /home/duino/data/cores.json

RUN ./arduino-cli lib update-index ${CLI_ARGS}
RUN ./arduino-cli lib search "" ${CLI_ARGS} > /home/duino/data/libs.json

RUN node setup/ cores
RUN node setup/ libs
RUN node setup/ boards

RUN rm -rf /home/duino/data/arduino/staging