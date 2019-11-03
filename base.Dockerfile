FROM node:10-alpine

RUN addgroup -S duino && adduser -S duino -G duino

COPY setup /home/duino/setup
COPY data /home/duino/data
# COPY Arduino /home/duino/Arduino

RUN chown duino:duino /home/duino -R

WORKDIR /home/duino
USER duino

RUN wget https://downloads.arduino.cc/arduino-cli/nightly/arduino-cli_nightly-20190921_Linux_64bit.tar.gz -O - | tar -xz

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