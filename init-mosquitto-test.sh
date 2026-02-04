#!/bin/sh

# Initialize Mosquitto MQTT broker for testing
# This script dynamically generates configuration and password file

set -e

echo "🚀 Initializing Mosquitto MQTT Broker for testing..."

# Get environment variables or use defaults
MQTT_USERNAME=${MQTT_USERNAME:-test_mqtt_user}
MQTT_PASSWORD=${MQTT_PASSWORD:-test_mqtt_password_ci}

echo "📝 Generating mosquitto.conf..."

cat > /mosquitto/config/mosquitto.conf <<EOF
# Mosquitto MQTT Broker Configuration
# Auto-generated for CI/CD testing

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
chmod 640 /mosquitto/config/passwd
chmod 644 /mosquitto/config/mosquitto.conf

echo "✅ Mosquitto configuration completed!"
echo "👤 MQTT Username: $MQTT_USERNAME"
echo "🔒 Password file created"

# Start mosquitto
echo "🚀 Starting Mosquitto..."
exec /usr/sbin/mosquitto -c /mosquitto/config/mosquitto.conf
