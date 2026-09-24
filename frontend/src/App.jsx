import { useEffect, useRef, useState } from "react"
import { MotorcontrollerDiv, PwmDiv, SpeedDiv, PidDiv, Cmd_velDiv } from "./components" 
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

  useEffect(() => {
    const socket = new WebSocket('ws://localhost:3001')
    socket.onopen = () => {
      console.log('Connected to Node.js.')
      document.getElementById('connected').textContent = 'Connected to Node.js'
    }
    socket.onmessage = (e) => {
      const message = JSON.parse(e.data)
      if (message.type === 'motor_data') setMotors(message.data)
    }
    socket.onclose = () => {
      console.log('Disconnected from Node.js')
      document.getElementById('connected').textContent = 'Not connected to Node.js'
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
      <MotorcontrollerDiv speed1={motors.speed1} speed2={motors.speed2} encoder1={motors.encoder1} encoder2={motors.encoder2}/>
      <hr />
      <button id='stop' onClick={() => sendCommand("pwm", {motor1: 0,motor2: 0,})}>Stop</button>
      
      <PwmDiv inputs={inputs} updateInputs={updateInputs} sendCommand={sendCommand}/>

      <SpeedDiv inputs={inputs} updateInputs={updateInputs} sendCommand={sendCommand}/>

      <PidDiv inputs={inputs} updateInputs={updateInputs} sendCommand={sendCommand}/>

      <Cmd_velDiv inputs={inputs} updateInputs={updateInputs} sendCommand={sendCommand}/>

      <div>
        <p id="connected">Not connected to Node.js</p>
      </div>
    </div>
  );
}

export default App;