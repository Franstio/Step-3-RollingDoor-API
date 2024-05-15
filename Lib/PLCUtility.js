import ModbusRTU from 'modbus-serial';

const client = new ModbusRTU();
client.connectRTU("/dev/ttyUSB0", { baudRate: 9600 });
//// set timeout, if slave did not reply back
client.setTimeout(5000);

export const switchLamp = async (lampType, isAlive) =>
    {
        const dict = {
            "RED" : 30,
            "GREEN" : 31
        };
        const address = dict[lampType];
        await client.writeRegister(address, isAlive ? 1 :  0);
    }
