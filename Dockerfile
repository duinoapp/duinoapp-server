FROM duino-docker-base:latest

USER root
COPY package*.json /home/duino/
RUN chown duino:duino /home/duino/package*.json
USER duino

RUN npm i

USER root
COPY src /home/duino/src
RUN chown duino:duino /home/duino/src -R
USER duino

EXPOSE 3030
CMD [ "node", "src/index.js" ]