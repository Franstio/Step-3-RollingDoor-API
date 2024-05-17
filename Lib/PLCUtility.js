import ModbusRTU from 'modbus-serial';



const client = new ModbusRTU();
client.connectRTU("/dev/ttyUSB0", { baudRate: 9600 });
//// set timeout, if slave did not reply back
client.setTimeout(5000);
export default client;
export const switchLamp = async (id,lampType, isAlive) => {
    const dict = {
        "RED": 30,
        "GREEN": 31
    };
    const address = dict[lampType];
    client.setID(id);
    try
    {
        await client.writeRegister(address, isAlive ? 1 : 0);
    }
    catch(error)
    {
        console.log([error,id,lampType,isAlive]);
    }
}
