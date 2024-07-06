import ModbusRTU from 'modbus-serial';
import bin from '../models/BinModel.js';



 const client = new ModbusRTU();
client.connectRTU("/dev/ttyUSB0", { baudRate: 9600 });
//// set timeout, if slave did not reply back
client.setTimeout(300);
export default client;
export const switchLamp = async (id, lampType, isAlive) => {
    const dict = {
        "RED": 30,
        "GREEN": 31
    };
    const address = dict[lampType];
//    client.setID(id);
    try {
        await writeCMD({id:id,address:address,value: isAlive ? 1 : 0});
    }
    catch (error) {
        console.log([error, id, lampType, address, isAlive]);
    }
} 

export const checkMaxWeight = async () => {
    while (true) {
        const dataBin = await bin.findAll();
        for (let i = 0; i < dataBin.length; i++) {
            console.log({ id: dataBin[i].id,clientId:dataBin[i].clientId });
            const latest = await bin.findOne({
                where: {id: dataBin[i].id}
            });
            await switchLamp(latest.clientId, 'RED', parseFloat(latest.weight) >= parseFloat(latest.max_weight));
        }
    }
}
export const readCMD = async (address,value)=>{
    let res = {data:0};
    try
    {
        res = await client.readHoldingRegisters(address,value);
        return res;
    }
    catch(err)
    {
        await new Promise((resolve) => setTimeout(resolve,100));
        return await readCMD(address,value);
    }
}
export const writeCMD = async (data)=>{
    try
    {
        client.setID(data.id);
        await client.writeRegister(data.address,data.value);
        return;
    }
    catch (err)
    {
        await new Promise((resolve) => setTimeout(resolve,100));
        await writeCMD(data);
    }
}