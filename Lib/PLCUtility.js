import ModbusRTU from 'modbus-serial';


let client = null;
export const getClient = () => {
    if (client == null) {
        try
        {
        client = new ModbusRTU();
        client.connectRTU("/dev/ttyUSB0", { baudRate: 9600 });
        //// set timeout, if slave did not reply back
        client.setTimeout(5000);
        }
        catch(error)
        {
            console.log(error);
            return client;
        }
    }
    return client;
}
export const switchLamp = async (lampType, isAlive) => {
    const dict = {
        "RED": 30,
        "GREEN": 31
    };
    const address = dict[lampType];
    await getClient().writeRegister(address, isAlive ? 1 : 0);
}
