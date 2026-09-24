import * as ROSLIB from "roslib";
import { WebSocket, WebSocketServer } from "ws";

global.WebSocket = WebSocket;

const ros = new ROSLIB.Ros({
  url: "ws://172.17.130.208:9090",
});

ros.on("connection", () => {
  console.log("Connected to ROS");
});
ros.on("error", (error) => {
  console.error("ROS error:", error);
});
ros.on("close", () => {
  console.log("ROS connection closed");
});

const motorCommand = new ROSLIB.Topic({
  ros,
  name: "/motor_command",
  messageType: "std_msgs/msg/String",
});

const cmdVel = new ROSLIB.Topic({
  ros,
  name: "/cmd_vel",
  messageType: "geometry_msgs/msg/Twist",
});

const motorData = new ROSLIB.Topic({
  ros,
  name: "/motor_data",
  messageType: "motordriver_msgs/msg/MotordriverMessage",
});

const wss = new WebSocketServer({
  port: 3001,
});

let wsocket = null;

wss.on("connection", (socket) => {
  console.log("React client connected");

  wsocket = socket;

  socket.on("close", () => {
    if (wsocket === socket) {
      wsocket = null;
    }

    console.log("React client disconnected");
  });

  socket.on("message", (rawMessage) => {
    try {
      const message = JSON.parse(rawMessage.toString());

      console.log("Received from React:", message);

      handleCommand(message);
    } catch (error) {
      console.error("Invalid WebSocket message:", error);
    }
  });
});

function publishPID(p, i, d) {
  const message = {
    data: `PID;${p};${i};${d};`,
  };

  console.log("Publishing PID:", message.data);

  motorCommand.publish(message);
}


function publishPWM(motor1, motor2) {
  const message = {
    data: `PWM;${motor1};${-motor2};`,
  };

  console.log("Publishing PWM:", message.data);

  motorCommand.publish(message);
}


function publishSpeed(motor1, motor2) {
  const message = {
    data: `SPD;${motor1};${-motor2};`,
  };

  console.log("Publishing SPD:", message.data);

  motorCommand.publish(message);
}


function publishCmdVel(linear, angular) {
  const message = {
    linear: {
      x: Number.parseFloat(linear),
      y: 0.0,
      z: 0.0,
    },

    angular: {
      x: 0.0,
      y: 0.0,
      z: Number.parseFloat(angular),
    },
  };

  console.log(
    "Publishing cmd_vel:",
    message
  );

  cmdVel.publish(message);
}

function handleCommand(message) {
  switch (message.type) {

    case "pwm":
      publishPWM(
        message.data.motor1,
        message.data.motor2
      );
      break;

    case "speed":
      publishSpeed(
        message.data.motor1,
        message.data.motor2
      );
      break;

    case "pid":
      publishPID(
        message.data.p,
        message.data.i,
        message.data.d
      );
      break;

    case "cmd_vel":
      publishCmdVel(
        message.data.linear,
        message.data.angular
      );
      break;

    default:
      console.error("Unknown command:", message.type);
  }
}

motorData.subscribe((message) => {

  const data = {
    speed1: message.speed1,
    speed2: message.speed2,
    encoder1: message.encoder1,
    encoder2: message.encoder2,
  };

  if (
    wsocket &&
    wsocket.readyState === WebSocket.OPEN
  ) {
    wsocket.send(
      JSON.stringify({
        type: "motor_data",
        data,
      })
    );
  }
});
