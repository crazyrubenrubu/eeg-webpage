const { SerialPort } = require('serialport');
async function list() {
  const ports = await SerialPort.list();
  console.log(JSON.stringify(ports, null, 2));
}
list();
