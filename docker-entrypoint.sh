#!/bin/sh
# Mosquitto entrypoint wrapper - generates config from .env then starts mosquitto

set -e

echo "🚀 Initializing Mosquitto MQTT Broker..."

# Get environment variables or use defaults
MQTT_USERNAME=${MQTT_USERNAME:-fantasyf1_mqtt}
MQTT_PASSWORD=${MQTT_PASSWORD:-change_this_password_in_production}

echo "📝 Generating mosquitto.conf..."

cat > /mosquitto/config/mosquitto.conf <<EOF
# Mosquitto MQTT Broker Configuration
# Auto-generated from environment variables

listener 1883

allow_anonymous false

# Authentication
password_file /mosquitto/config/passwd

# Persistence
persistence true
persistence_location /mosquitto/data/

# Logging
log_dest syslog
log_dest stdout
log_type error
log_type warning
log_type notice
log_type information

# Connections
max_connections -1
max_keepalive 65535

# Security
max_queued_messages 1000
EOF

echo "🔐 Generating password file..."

# Create password file using mosquitto_passwd
rm -f /mosquitto/config/passwd
touch /mosquitto/config/passwd

# Add user
mosquitto_passwd -b /mosquitto/config/passwd "$MQTT_USERNAME" "$MQTT_PASSWORD"

# Set correct permissions
chmod 600 /mosquitto/config/passwd
chmod 644 /mosquitto/config/mosquitto.conf

echo "✅ Mosquitto configuration completed!"
echo "👤 MQTT Username: $MQTT_USERNAME"

# Start mosquitto
exec /usr/sbin/mosquitto -c /mosquitto/config/mosquitto.conf "$@"