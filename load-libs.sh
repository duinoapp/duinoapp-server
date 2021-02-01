file="/data/arduino.tar.gz"
uri="http://duino-dump.s3-website.us-east-2.amazonaws.com/arduino.tar.gz"

curl -o "$file" -z "$file" "$uri"
rm -rf /home/duino/Arduino
tar -xzf $file