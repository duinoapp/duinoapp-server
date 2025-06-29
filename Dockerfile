FROM node:20-bookworm

USER root
RUN useradd duino

RUN mkdir -p /mnt/duino-data
RUN chmod 0777 /mnt/duino-data

RUN apt-get update && apt-get install build-essential python3-pip python3-serial python3-serial -y

# RUN pip install pyserial

# clean up apt
RUN apt-get clean
RUN rm -rf /var/lib/apt/lists/*

COPY setup /home/duino/setup
COPY src/utils /home/duino/src/utils
# COPY Arduino /home/duino/Arduino
# RUN mkdir /home/duino
RUN chmod +x /home/duino/setup/*.sh
RUN chown duino:duino /home/duino -R

WORKDIR /home/duino
USER duino

COPY package*.json /home/duino/
RUN npm ci

RUN node ./setup/docker-install.js

COPY src /home/duino/src

EXPOSE 3030
CMD [ "node", "src/index.js" ]