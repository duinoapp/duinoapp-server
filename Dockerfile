FROM duinoapp/arduino-cli-base:latest

USER root
COPY package*.json /home/duino/
RUN chown duino:duino /home/duino/package*.json
USER duino

RUN npm ci

USER root
COPY src /home/duino/src
RUN chown duino:duino /home/duino/src -R
USER duino

EXPOSE 3030
CMD [ "node", "src/index.js" ]