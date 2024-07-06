# Sawah App Deployment Guide

This guide provides instructions to run the Sawah App server as a service in the background on a Ubuntu machine.

## Service Configuration

Create a systemd service file with the following content:

```
sudo vim /etc/systemd/system/sawah-app.service
```

Then copy this:

```ini
[Unit]
Description="Sawah App"
After=network.target

[Service]
ExecStart=/usr/bin/node /home/ubuntu/app/smart-tour-guide/server.js
WorkingDirectory=/home/ubuntu/app/smart-tour-guide
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=SawahApp
EnvironmentFile=/home/ubuntu/app/smart-tour-guide/.env

[Install]
WantedBy=multi-user.target
```
