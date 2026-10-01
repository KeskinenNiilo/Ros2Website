import * as ROSLIB from "roslib";
import { WebSocket, WebSocketServer } from "ws";

global.WebSocket = WebSocket;

let ros = null;
let wsocket = null;
let rosUrl = null;

const motorCommand = new ROSLIB.Topic({
  name: "/motor_command",
  messageType: "std_msgs/msg/String",
});

const cmdVel = new ROSLIB.Topic({
  name: "/cmd_vel",
  messageType: "geometry_msgs/msg/Twist",
});

const motorData = new ROSLIB.Topic({
  name: "/motor_data",
  messageType: "motordriver_msgs/msg/MotordriverMessage",
});

const batteryData = new ROSLIB.Topic({
  name: "/battery_voltage",
  messageType: "std_msgs/msg/Float32",
});

function handleMotorData(message) {
  if (wsocket && wsocket.readyState === WebSocket.OPEN) {
    wsocket.send(JSON.stringify({
      type: "motor_data",
      data: {
        speed1: message.speed1,
        speed2: message.speed2,
        encoder1: message.encoder1,
        encoder2: message.encoder2,
      },
    }));
  }
}

let isCharging = false;
let voltHistory = [];
const SAMPLE_WINDOW_MS = 2 * 60 * 1000;
const PLUG_IN_JUMP_VOLTS = 0.04;
const SUST_RISE_VOLTS = 0.03;
const DROP_TRESHOLD = -0.015;

function handleBatteryData(message) {
  const currentVoltage = message.data;
  const now = Date.now();
  const MIN_VOLTAGE = 10.5;
  const MAX_VOLTAGE = 12.6;

  let percentage = Math.round(((currentVoltage - MIN_VOLTAGE) / (MAX_VOLTAGE - MIN_VOLTAGE)) * 100);
  percentage = Math.max(0, Math.min(100, percentage));

  voltHistory.push({ time: now, voltage: currentVoltage });
  while (voltHistory.length > 0 && (now - voltHistory[0].time) > SAMPLE_WINDOW_MS) {
    voltHistory.shift();
  }

  const prevReading = voltHistory.length > 1 ? voltHistory[voltHistory.length - 2].voltage : currentVoltage;
  const oldestReading = voltHistory[0].voltage;
  const immediateDelta = currentVoltage - prevReading;
  const windowDelta = currentVoltage - oldestReading;

  if (!isCharging) {
    if (immediateDelta >= PLUG_IN_JUMP_VOLTS || (voltHistory.length >= 6 && windowDelta >= SUST_RISE_VOLTS)) {
      isCharging = true;
    }
  } else {
    if (windowDelta <= DROP_TRESHOLD || immediateDelta < -0.01) {
      isCharging = false;
    }
  }

  console.log(`Voltage: ${currentVoltage.toFixed(2)}V | Battery: ${percentage}% | Charging: ${isCharging}`);

  if (wsocket && wsocket.readyState === WebSocket.OPEN) {
    wsocket.send(JSON.stringify({
      type: "battery_data",
      data: percentage,
      isCharging: isCharging,
    }));
  }
}

function connectToRos(targetUrl) {
  if (ros && ros.isConnected) {
    console.log("Stopping motors before switching connection");
    motorCommand.publish({data: "PWM;0;0;"});
  }

  if (ros) {
    try { motorData.unsubscribe(handleMotorData); } catch (e) {}
    try { batteryData.unsubscribe(handleBatteryData); } catch (e) {}
    ros.close();
  }
  rosUrl = targetUrl;
  console.log(`Attempting connection to: ${targetUrl}`);
  ros = new ROSLIB.Ros({ url: targetUrl });

  ros.on("connection", () => {
    console.log("Connected to ROS");
    if (wsocket && wsocket.readyState === WebSocket.OPEN) {
      wsocket.send(JSON.stringify({ type: "ros_status", connected: true, url: rosUrl, }));
    }
  });

  ros.on("error", (error) => {
    console.error("ROS error:", error);
    if (wsocket && wsocket.readyState === WebSocket.OPEN) {
      wsocket.send(JSON.stringify({ type: "ros_status", connected: false }));
    }
  });

  ros.on("close", () => {
    console.log("ROS connection closed");
    if (wsocket && wsocket.readyState === WebSocket.OPEN) {
      wsocket.send(JSON.stringify({ type: "ros_status", connected: false }));
    }
  });


  motorCommand.ros = ros;
  cmdVel.ros = ros;
  motorData.ros = ros;
  batteryData.ros = ros;

  motorData.subscribe(handleMotorData);
  batteryData.subscribe(handleBatteryData);
}

function publishPID(p, i, d) {
  motorCommand.publish({ data: `PID;${p};${i};${d};` });
}
function publishPWM(motor1, motor2) {
  motorCommand.publish({ data: `PWM;${motor1};${-motor2};` });
}
function publishSpeed(motor1, motor2) {
  motorCommand.publish({ data: `SPD;${motor1};${-motor2};` });
}
function publishCmdVel(linear, angular) {
  cmdVel.publish({
    linear:  { x: Number.parseFloat(linear), y: 0, z: 0 },
    angular: { x: 0, y: 0, z: Number.parseFloat(angular) },
  });
}

function handleCommand(message) {
  switch (message.type) {
    case "pwm":     publishPWM(message.data.motor1, message.data.motor2); break;
    case "speed":   publishSpeed(message.data.motor1, message.data.motor2); break;
    case "pid":     publishPID(message.data.p, message.data.i, message.data.d); break;
    case "cmd_vel": publishCmdVel(message.data.linear, message.data.angular); break;
    default:        console.error("Unknown command:", message.type);
  }
}

const wss = new WebSocketServer({ port: 3001 });

wss.on("connection", (socket) => {
  console.log("React client connected");
  wsocket = socket;

  if (ros && ros.isConnected) {
    socket.send(JSON.stringify({ type: "ros_status", connected: true, url: rosUrl }));
  }

  socket.on("close", () => {
    if (wsocket === socket) wsocket = null;
    console.log("React client disconnected");
  });

  socket.on("message", (rawMessage) => {
    let message;
    try {
      message = JSON.parse(rawMessage.toString());
    } catch (error) {
      console.error("Invalid WebSocket message:", error);
      return;
    }

    console.log("Received from React:", message);

    if (message.type === "connect_ros") {
      connectToRos(message.data.url);
      return;
    }

    handleCommand(message);
  });
});

connectToRos("ws://172.17.130.208:9090");