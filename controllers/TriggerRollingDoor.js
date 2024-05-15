//import ModbusRTU from 'modbus-serial';
import client, { switchLamp } from '../Lib/PLCUtility.js';
import bin from '../models/BinModel.js';
//client.connectRTU("/dev/ttyUSB0", { baudRate: 9600 });
//// set timeout, if slave did not reply back
//client.setTimeout(5000);



export const rollingdoorUp = async (req, res) => {
    try {
        const {idRollingDoor} = req.body;
	console.log({id: idRollingDoor});

       client.setID(idRollingDoor);
        if (!client.isOpen) {
            client.open( () => {
                console.log("modbus open");
           });
        }
        const address = 20;
        const value = 1;
        const log = await client.writeRegister(address,value);
//        const data = await client.readHoldingRegisters(address, 8);
//        console.log({ log: log, data: data });
        if (value === 1) {
            res.status(200).json({ msg: `Rolling Door Buka` });
        } else {
            res.status(200).json({ msg: `Kunci dengan address ${address} berhasil ditutup.` });
        }


    } catch (error) {
        res.status(500).json({ msg: error });
    }
};
export const triggerAvailableBin = async (req,res) =>{
    const { wasteId, valueIsOpen } = req.body;
    const availableBin = await bin.findAll(
        {
            where:{
                type_waste: wasteId
            }
        }
    );
    if (availableBin.length < 1)
    {
        res.status(200).json({msg: 'Success but no bin available'});
    }
    console.log(availableBin);
    for (let i=0;i<availableBin.length;i++)
    {
        await switchLamp("RED",parseFloat(availableBin[i].weight) >= parseFloat(availableBin[i].max_weight));
        await switchLamp("GREEN",parseFloat(availableBin[i].weight) < parseFloat(availableBin[i].max_weight) && valueIsOpen);
    }
    res.status(200).json({msg:"Success Trigger bin"});
}
export const rollingDoorDown = async (req, res) => {
    try {
        const address = 21;
        const value = 1;
        const {idRollingDoor} = req.body;
	console.log(idRollingDoor);

        client.setID(idRollingDoor);
//	await new Promise(resolve => setTimeout(resolve,5000));
        await client.writeRegister(address, value);
//        const data = await client.readHoldingRegisters(address, 8);

        if (value === 1) {
            res.status(200).json({ msg: `Rolling Door Ditutup ` + address + " " + value });
        } else {
            res.status(200).json({ msg: `Kunci dengan address ${address} berhasil ditutup.` });
        }
    } catch (error) {
        res.status(500).json({ msg: error});
    }
};




