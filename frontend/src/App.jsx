import { useEffect, useRef, useState } from "react"
import './App.css'

const App = () => {
  const wsRef = useRef(null)
  const [motors, setMotors] = useState({
    speed1: 0, speed2: 0, encoder1: 0, encoder2: 0,
  })
  const [inputs, setInputs] = useState({
    pwm1: "", pwm2: "",
    speed1: "", speed2: "",
    p: "", i: "", d: "",
    linear: "", angular: "",
  })
  const [batteryPercentage, setBatteryPercentage] = useState("-")


  useEffect(() => {
    const socket = new WebSocket('ws://localhost:3001')
    socket.onopen = () => {
      console.log('Connected to Node.js.')
      let connected = document.getElementById('connected')
      connected.textContent = 'Connected to Node.js'
      connected.classList.remove("connectedFalse")
      connected.classList.add("connectedTrue")
    }
    socket.onmessage = (e) => {
      const message = JSON.parse(e.data)
      if (message.type === 'motor_data') setMotors(message.data)

      if (message.type === 'battery_data') {
        if(message.isCharging === 'true') {
             setBatteryPercentage(`🔌 ${message.data}`)
        }else{
            setBatteryPercentage(message.data)
        }
      } 
    }
    socket.onclose = () => {
      console.log('Disconnected from Node.js')
      let connected = document.getElementById('connected')
      connected.textContent = 'Not connected to Node.js'
      connected.classList.remove("connectedTrue")
      connected.classList.add("connectedFalse")
    }
    wsRef.current = socket    
    return () => socket.close()
  }, [])

  const updateInputs = (name, value) => {
    setInputs((previous) => ({
      ...previous, [name]: value
    }))
  }

  const sendCommand = (command, data) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: command, data }))
    }
  }

  return (
    <div>
        <div id="headerdiv">
            <div id="headertext">
                <h1 id="ros2h1">Ros2</h1>
                <h2 id="description">Website to control a Ros2 robot</h2>
            </div>
            <div id="systeminfo">
                <h2 id="ip">172.17.130.208</h2>
                <h3 id="connected" class="connectedFalse">Not Connected</h3>
                <p id="batterypercentage">{batteryPercentage}%</p>
            </div>
        </div>
        <table id="motordata">
            <tbody id="motordatabody">
                <tr id="motordatatr">
                    <th id="motor1spd">{motors.speed1}</th>
                    <th id="motor2spd">{motors.speed2}</th>
                    <th id="motor1encoder">{motors.encoder1}</th>
                    <th id="motor2encoder">{motors.encoder2}</th>
                </tr>
            </tbody>
        </table>
        <div id="stopdiv">
            <button id="stopbutton" onClick={() => sendCommand("pwm", {motor1: 0,motor2: 0,})}>STOP</button>
        </div>
        <table id="controls">
            <tbody id="controlstbody">
                <tr id="controlstr1">
                    <th id="pwn">
                        <div id="pwmdiv">
                            <div id="pwminputs">
                                <input
                                id="pwminput1"
                                placeholder="Motor1 PWM"
                                value={inputs.pwm1}
                                onChange={(e) => updateInputs("pwm1", e.target.value)}
                                />
                                <input
                                id="pwminput2"
                                placeholder="Motor2 PWM"
                                onChange={(e) => updateInputs("pwm2", e.target.value)}
                                />
                            </div>
                            <button id="pwmbutton" onClick={() =>sendCommand("pwm", {motor1: inputs.pwm1,motor2: inputs.pwm2,})}>PWM</button>
                        </div>
                    </th>
                    <th id="spd">
                        <div id="spddiv">
                            <div id="spdinputs">
                                <input
                                id="spdinput1"
                                placeholder="Motor1 SPD"
                                onChange={(e) => updateInputs("speed1", e.target.value)}
                                />
                                <input
                                id="spdinput2"
                                placeholder="Motor2 SPD"
                                onChange={(e) => updateInputs("speed2", e.target.value)}
                                />
                            </div>
                            <button id="spdbutton" onClick={() =>sendCommand("speed", {motor1: inputs.speed1,motor2: inputs.speed2,})}>SPEED</button>
                        </div>
                    </th>
                </tr>
                <tr id="controlstr2">
                    <th id="pid">
                        <div id="piddiv">
                            <div id="pidinputs">
                                <input
                                id="p"
                                placeholder="P"
                                onChange={(e) => updateInputs("p", e.target.value)}
                                />
                                <input
                                id="i"
                                placeholder="I"
                                onChange={(e) => updateInputs("i", e.target.value)}
                                />
                                <input
                                id="d"
                                placeholder="D"
                                onChange={(e) => updateInputs("d", e.target.value)}
                                />
                            </div>
                            <button id="pidbutton" onClick={() => sendCommand("pid", { p: inputs.p, i: inputs.i, d: inputs.d, })}>PID</button>
                        </div>
                    </th>
                    <th id="cmd_vel">
                        <div id="cmd_veldiv">
                            <div id="cmd_velinputs">
                                <input
                                id="linear"
                                placeholder="Linear"
                                onChange={(e) => updateInputs("linear", e.target.value)}
                                />
                                <input
                                id="angular"
                                placeholder="Angular"
                                onChange={(e) => updateInputs("angular", e.target.value)}
                                />
                            </div>
                            <button id="cmd_velbutton" onClick={() => sendCommand("cmd_vel", { linear: inputs.linear, angular: inputs.angular, })}>CMD_VEL</button>
                        </div>
                    </th>
                </tr>
            </tbody>
        </table>
    </div>
  )
}

export default App