FROM node:12-buster

USER root
RUN useradd duino

RUN mkdir -p /mnt/duino-data
RUN chmod 0777 /mnt/duino-data

COPY setup /home/duino/setup
RUN chmod +x /home/duino/setup/*.sh
# COPY Arduino /home/duino/Arduino

# RUN mkdir /home/duino
RUN chown duino:duino /home/duino -R
RUN apt-get update && apt-get install build-essential -y

WORKDIR /home/duino
USER duino

COPY package*.json /home/duino/
RUN npm ci

COPY src /home/duino/src

RUN node ./setup/docker-install.js

EXPOSE 3030
CMD [ "node", "src/index.js" ]