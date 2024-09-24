import ModbusRTU from 'modbus-serial';
import bin from '../models/BinModel.js';


const getClient=  ()=>{
    const _client = new ModbusRTU();
_client.connectRTU(process.env.PORT_PLC, { baudRate: 9600 });
console.log("PLC PORT: "+ process.env.PORT_PLC);

//// set timeout, if slave did not reply back
_client.setTimeout(100);
return _client;
}
 const client = getClient();
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
    }
} 

export const checkMaxWeight = async () => {
    while (true) {
        const dataBin = await bin.findAll();
        for (let i = 0; i < dataBin.length; i++) {
            /*const latest = await bin.findOne({
                where: {id: dataBin[i].id}
            });*/
            const maxWeight =  parseFloat(dataBin[i].max_weight) * 0.95;

            await switchLamp(dataBin[i].clientId, 'RED', parseFloat(dataBin[i].weight) >= maxWeight);
        }
        await new Promise((resolve)=>setTimeout(resolve,5000));
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
        await new Promise((resolve) => setTimeout(resolve,1));
        return await readCMD(address,value);
    }
}
export const writeCMD = async (data)=>{
    let r = {data:[0]};
    try
    {
        client.setID(data.id);
        r = await client.writeRegister(data.address,data.value);
        return r;
    }
    catch (err)
    {
        await new Promise((resolve) => setTimeout(resolve,1));
        return await writeCMD(data);
    }
}