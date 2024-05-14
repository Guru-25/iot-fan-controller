const apiKey = 'xxxx'; 
const refreshToken = 'xxxx';
const deviceId = 'xxxx';

const apiServer = 'api.developer.atomberg-iot.com';

let accessToken = '';
let limitExceeded = true;
let isOnline = false;
let powerState = false;
let speedState = 0;
let ledState = false;

async function getAccessToken() {
    try {
        const response = await fetch(`https://${apiServer}/v1/get_access_token`, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${refreshToken}`,
            'x-api-key': apiKey
        }
        });
        const data = await response.json();
        accessToken = data.message.access_token;
        console.log('access token generated');
        limitExceeded = false;
    }
    catch (error) {
        document.getElementById('error-catch').innerText = 'Limit Exceeded';
    }
}

async function getDeviceState() {
    const response = await fetch(`https://${apiServer}/v1/get_device_state?device_id=${deviceId}`, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
            'x-api-key': apiKey
        }
    });
    const data = await response.json();
    isOnline = data.message.device_state[0].is_online;
    if(isOnline) {
        powerState = data.message.device_state[0].power;
        speedState = data.message.device_state[0].last_recorded_speed;
        ledState = data.message.device_state[0].led;
        if(powerState) {
            document.getElementById('offline-error').style.display = 'block';
        }
        else {
            document.getElementById('offline-error').style.display = 'none';
        }
    }
    else {
        document.getElementById('error-catch').innerText = 'Device is Offline'
    }
}

window.onload = async function() {
    await getAccessToken();
    if(!limitExceeded) {
        await getDeviceState();
        if(isOnline) {
            document.getElementById('power-switch').checked = powerState;
            document.querySelector(`button[data-speed="${speedState}"]`).classList.add('active-speed');
            document.getElementById('led-switch').checked = ledState;
        }
    }
}

async function sendCommand(commandType, value) {
    const response = await fetch(`https://${apiServer}/v1/send_command`, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'x-api-key': apiKey
        },
        body: JSON.stringify({
        device_id: deviceId,
        command: {
            [commandType]: value
        }
        })
    });
    await getDeviceState();

    const responseData = await response.json();

    await getDeviceState();

    if (commandType == 'power') {
        if (value) {
            console.log('power onned');
        }
        else {
            console.log('power offed');
        }
    }
    else if (commandType == 'speed') {
        console.log(`changed speed to ${value}`);
    }
    else if (commandType == 'led') {
        if (value) {
            console.log('led onned');
        }
        else {
            console.log('led offed');
        }
    }
}

async function togglePower() {
    const powerSwitch = document.getElementById('power-switch');
    if (powerSwitch.checked) {
        await sendCommand('power', true);
    }
    else {
        await sendCommand('power', false);
    }
}

async function setFanSpeed(value) {
    await sendCommand('speed', value);
    for (let i = 1; i <= 6; i++) {
        const button = document.querySelector(`button[data-speed="${i}"]`);
        if (i == value) {
            button.classList.add('active-speed');
        }
        else {
            button.classList.remove('active-speed');
        }
    }
}

async function toggleLED() {
    const ledSwitch = document.getElementById('led-switch');
    if (ledSwitch.checked) {
        await sendCommand('led', true);
    }
    else {
        await sendCommand('led', false);
    }
}
