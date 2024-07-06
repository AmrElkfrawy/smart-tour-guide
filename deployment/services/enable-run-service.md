# create service file

sudo vim /etc/systemd/system/sawah-app.service

# enable service

sudo systemctl enable sawah-app.service

# start service

sudo systemctl start sawah-app.service

# view status

sudo systemctl status sawah-app.service

# restart in case of code changes

sudo systemctl restart sawah-app.service

# reload services if config changed

sudo systemctl daemon-reload
