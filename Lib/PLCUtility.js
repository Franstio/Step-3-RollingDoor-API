import ModbusRTU from 'modbus-serial';
import bin from '../models/BinModel.js';



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
        console.log([error,id,lampType,address,isAlive]);
    }
    await new Promise(resolve=> setTimeout(function(){return resolve();},2000));
}

export const checkMaxWeight = async ()=>{
    const dataBin = await bin.findAll();
    for (let i=0;i<dataBin.length;i++)
    {
        console.log({id:dataBin[i]});
        await switchLamp(dataBin[i].id,'RED',parseFloat(dataBin[i].weight) >= parseFloat(dataBin[i].max_weight));
    }
}