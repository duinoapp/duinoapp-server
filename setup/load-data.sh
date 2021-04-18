#!/bin/bash

cd /mnt/duino-data

./arduino-cli core update-index --config-file /mnt/duino-data/arduino-cli.yml --format json
./arduino-cli core search "" --config-file /mnt/duino-data/arduino-cli.yml --format json > /mnt/duino-data/cores.json

./arduino-cli lib update-index --config-file /mnt/duino-data/arduino-cli.yml --format json
./arduino-cli lib search "" --config-file /mnt/duino-data/arduino-cli.yml --format json > /mnt/duino-data/libs.json