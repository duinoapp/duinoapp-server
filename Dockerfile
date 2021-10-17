FROM node:12-buster

USER root
RUN useradd duino

RUN mkdir -p /mnt/duino-data
RUN chmod 0777 /mnt/duino-data

COPY setup /home/duino/setup
COPY src/utils /home/duino/src/utils
RUN chmod +x /home/duino/setup/*.sh
# COPY Arduino /home/duino/Arduino

# RUN mkdir /home/duino
RUN chown duino:duino /home/duino -R
RUN apt-get update && apt-get install build-essential python-pip -y
RUN pip install pyserial

WORKDIR /home/duino
USER duino

COPY package*.json /home/duino/
RUN npm ci

RUN node ./setup/docker-install.js

COPY src /home/duino/src

EXPOSE 3030
CMD [ "node", "src/index.js" ]