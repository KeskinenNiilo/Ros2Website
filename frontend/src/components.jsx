export const MotorcontrollerDiv = (props) => {
    return (
        <div>
            <h1>Motor Controller</h1>
            <table>
                <tbody>
                    <tr>
                        <th>Motor 1 Speed: {props.speed1}</th>
                        <th>Motor 2 Speed: {props.speed2}</th>
                        <th>Motor 1 Encoder: {props.encoder1}</th>
                        <th>Motor 2 Encoder: {props.encoder2}</th>
                    </tr>
                </tbody>
            </table>
        </div>
    )
}

export const PwmDiv = ( {inputs, updateInputs, sendCommand} ) => {
    return (
        <div>
            <h3>PWM</h3>
            <input
                placeholder="Motor1 PWM"
                value={inputs.pwm1}
                onChange={(e) => updateInputs("pwm1", e.target.value)}
            />
            <input
                placeholder="Motor2 PWM"
                value={inputs.pwm2}
                onChange={(e) => updateInputs("pwm2", e.target.value)}
            />
            <button onClick={() =>sendCommand("pwm", {motor1: inputs.pwm1,motor2: inputs.pwm2,})}>PWM</button>
        </div>
    )
}

export const SpeedDiv = ( {inputs, updateInputs, sendCommand} ) => {
    return (
        <div>
            <h3>Speed</h3>
            <input
                placeholder="Motor1 SPD"
                value={inputs.speed1}
                onChange={(e) => updateInputs("speed1", e.target.value)}
            />
            <input
                placeholder="Motor2 SPD"
                value={inputs.speed2}
                onChange={(e) => updateInputs("speed2", e.target.value)}
            />
            <button onClick={() =>sendCommand("speed", {motor1: inputs.speed1,motor2: inputs.speed2,})}>SPD</button>
        </div>
    )
}

export const PidDiv = ( {inputs, updateInputs, sendCommand} ) => {
    return (
        <div>
            <h3>PID</h3>
            <input
                placeholder="P"
                value={inputs.p}
                onChange={(e) => updateInputs("p", e.target.value)}
            />
            <input
                placeholder="I"
                value={inputs.i}
                onChange={(e) => updateInputs("i", e.target.value)}
            />
            <input
                placeholder="D"
                value={inputs.d}
                onChange={(e) => updateInputs("d", e.target.value)}
            />
            <button onClick={() => sendCommand("pid", { p: inputs.p, i: inputs.i, d: inputs.d, })}>PID</button>
        </div>
    )
}

export const Cmd_velDiv = ( {inputs, updateInputs, sendCommand} ) => {
    return (
        <div>
            <h3>cmd_vel</h3>
            <input
                placeholder="Linear Speed"
                value={inputs.linear}
                onChange={(e) => updateInputs("linear", e.target.value)}
            />
            <input
                placeholder="Angular Speed"
                value={inputs.angular}
                onChange={(e) => updateInputs("angular", e.target.value)}
            />
            <button onClick={() => sendCommand("cmd_vel", { linear: inputs.linear, angular: inputs.angular, })}>cmd_vel</button>
        </div>
    )
}