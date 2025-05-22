//import ModbusRTU from 'modbus-serial';
import client, { readCMD, switchLamp, writeCMD } from '../Lib/PLCUtility.js';
import Container from "../models/ContainerModel.js"
import waste from "../models/WesteModel.js";
import bin from "../models/BinModel.js";
import { QueryTypes, where } from 'sequelize';
import axios from 'axios';
import db from '../config/db.js';
import moment from 'moment';
import transaction from '../models/TransactionModel.js';
import employee from '../models/EmployeeModel.js';

const getClientId =  async (rollingDoorId)=>{
    try
    {
    const sBin = await bin.findOne({
        where: {id: rollingDoorId}
    });
        if (!sBin )
            return null;
        if (!sBin.toJSON().clientId)
            return null;
        return sBin.toJSON().clientId;
    }
    catch(err)
    {
        return null;
    }
}
export const ToggleRollingDoor  = async (id,openDoor)=>{
    const address  =openDoor  ?20 : 21;
    const value = 1;
    writeCMD({id:id,address:address,value:value}); 
}

export const rollingdoorUp = async (req, res) => {
        const {idRollingDoor} = req.body;
        const clientId = await getClientId(idRollingDoor);
        const address = 20;
        const value = 1;
        if (clientId==null)
        {
            res.status(500).json({err:"bin not found",id:idRollingDoor});
            return ;
        }
        try {
        writeCMD({id:clientId,address:address,value:value});
        const data = await readCMD(address, 8);
        if (value === 1) {
            res.status(200).json({ msg: `Rolling Door Buka`,client:clientId,address:address,val:value});
        } else {
            res.status(200).json({ msg: `Kunci dengan address ${address} berhasil ditutup.` });
        }


    } catch (error) {
        if (error.name=="TransactionTimedOutError")
        {
            if (value === 1) {
                res.status(200).json({ msg: `Rolling Door Buka` });
            } else {
                res.status(200).json({ msg: `Kunci dengan address ${address} berhasil ditutup.` });
            }
    
        }
        else
            res.status(500).json({ msg: error,clientId:clientId,id:idRollingDoor });
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
    for (let i=0;i<availableBin.length;i++)
        await switchLamp(availableBin[i].clientId,"GREEN",parseFloat(availableBin[i].weight) < parseFloat(availableBin[i].max_weight) && valueIsOpen);
    for (let i= 0 ;i<availableBin.length;i++)
    {
        const maxWeight =  parseFloat(availableBin[i].max_weight) * 0.95;
        await switchLamp(availableBin[i].clientId, "RED",parseFloat(availableBin[i].weight) >= maxWeight && valueIsOpen);
    }
    res.status(200).json({msg:"Success Trigger bin"});
}
export const rollingDoorDown = async (req, res) => {
        const address = 21;
        const value = 1;
        const {idRollingDoor} = req.body;

        const clientId = await getClientId(idRollingDoor);
        if (clientId==null)
        {
            res.status(500).json({err:"bin not found",id:idRollingDoor});
            return ;
        }
        try
        {
//	await new Promise(resolve => setTimeout(resolve,5000));
       writeCMD({id:clientId,address:address,value: value});
//        const data = await client.readHoldingRegisters(address, 8);

        res.status(200).json({ msg: `Rolling Door Ditutup `,client:clientId,address:address,val:value});
        return;
    } catch (error) {
        if (error.name=="TransactionTimedOutError")
        {
            if (value === 1) {
                res.status(200).json({ msg: `Rolling Door Ditutup ` + address + " " + value });
            } else {
                res.status(200).json({ msg: `Kunci dengan address ${address} berhasil ditutup.` });
            }
    
        }
        else
            res.status(500).json({ msg: error,clientId:clientId,id:idRollingDoor });
    }
};

export const switchLampAPI = async (req,res) => {
    const {id,lamp,value} = req.query;
    await switchLamp(id,lamp,value=='1');
    res.status(200).json({msg:"ok"});
}
export const SalesPidsg = async (salesData)=>{
        try
        {
            await axios.post(
                `http://${process.env.PIDSG}/api/pid/activityLogbyPcAll`,
                {
                    stationname: "STEP 3 COLLECTION",
                badgeno: salesData.badgeno,
                frombin: salesData.frombin, 
                weight: 0,
                activity: "SALES",
                filename: null,
                postby: "Local Step 3",
                tobin: salesData.tobin ,
                postDate: salesData.loginDate,
                loginDate: salesData.loginDate,
                binname:  '',
                step2value: '',
                }
            );
          return true;
        }
        catch(er)
        {
            console.log(er);
            return false;
        }

}
// export const SyncSales = async ()=>{
//     const data = await db.query("Select t.id,'SYSTEM' as badgeno,t.status,t.isSuccess,t.binName as frombin,t.binName as tobin,t.neto,c.weightbin,c.step2value,t.recordDate as loginDate from transaction t left join container c on t.idContainer=c.containerId where t.isSuccess=0 and status='SALES';",{type: QueryTypes.SELECT});
//     if (!data || data.length < 1)
//         return data;
//     let pending=[];
//     for (let i=0;i<data.length;i++)
//     {
//         const res = await SalesPidsg(data[i]);
//         pending.push(res);
//         await db.query(`UPDATE transaction set isSuccess=1 where id=?`,{
//             type:QueryTypes.UPDATE,
//             replacements: [ data[i].id]
//         });
//     }
//     return pending;
// }
export const Step4Check = async (binname)=>{
    try
    {
        const res = await axios.get(`http://${process.env.PIDSG}/api/pid/step4/${binname}`);
        const data = res.data.result;
        if (!data || data.length < 1)
            return false;
        const lastDt = moment(data[0].dt).format('YYYY-MM-DD HH:mm:ss');
        const check = await db.query(`select * from bin where name='${binname}' and (last_empty < '${lastDt.toString()}' or last_empty is null);`,{
            type:QueryTypes.SELECT
        });
        if (check.length < 1)
            return false;
        await db.query("UPDATE bin Set last_empty=?,weight=0 where name=?",{
            type:QueryTypes.UPDATE,
            replacements:[lastDt.toString(),data[0].frombin_name]
        });
        const checkEmp = await db.query('Select 1 from employee where badgeId=?',{
            type:QueryTypes.SELECT,
            replacements:[data[0].badgeno]
        });
        if (checkEmp.length < 1)
        {
            data[0].badgeno = -1;
        }

        const checkBin = await db.query('Select id,name,type_waste from bin where name=?',
        {
            type:QueryTypes.SELECT,
            replacements: [data[0].frombin_name]
        });
        const salesRes = await SalesPidsg({

              badgeno: data[0].badgeno,
              frombin: checkBin[0].name, 
              tobin: checkBin[0].name ,
              loginDate: lastDt.toString(),
        });
        await db.query("INSERT INTO transaction(badgeid,idwaste,neto,recordDate,loginDate,binId,binName,status,issuccess) VALUES(?,?,?,?,?,?,?,?,?)",{
            replacements:[
                data[0].badgeno,
                checkBin[0].type_waste,
                parseFloat(data[0].discharge_weight),
                lastDt.toString(),
                lastDt.toString(),
                checkBin[0].id,
                checkBin[0].name,
                'SALES',
                1
            ]
        });
        return true;
    }
    catch (er)
    {
        console.log(er);
        return false;
    }
}

export const rollingdoorUpManualWeb = async (req, res) => {
        const {idRollingDoor,role} = req.body;
        
        if (role !== 1) {
            return res.status(403).json({ msg: 'Access denied.' });
        }

        const address = 20;
        const value = 1;
        const clientId = await getClientId(idRollingDoor);
        if (clientId==null)
        {
            res.status(500).json({err:"bin not found",id:idRollingDoor});
            return ;
        }
        try
        {
         writeCMD({id:clientId,address:address,value:value});
//        const data = await client.readHoldingRegisters(address, 8);
        if (value === 1) {
            res.status(200).json({ msg: `Rolling Door Buka` });
        } else {
            res.status(200).json({ msg: `Kunci dengan address ${address} berhasil ditutup.` });
        }


    } catch (error) {
        if (error.name=="TransactionTimedOutError")
        {
            if (value === 1) {
                res.status(200).json({ msg: `Rolling Door Buka` });
            } else {
                res.status(200).json({ msg: `Kunci dengan address ${address} berhasil ditutup.` });
            }
    
        }
        else
            res.status(500).json({ msg: error,clientId:clientId,id:idRollingDoor });
    }
};

export const rollingDoorDownManualWeb = async (req, res) => {
        const address = 21;
        const value = 1;
        const {idRollingDoor,role} = req.body;
        if (role !== 1) {
            return res.status(403).json({ msg: 'Access denied.' });
        }

        const clientId = await getClientId(idRollingDoor);
        if (clientId==null)
        {
            res.status(500).json({err:"bin not found",id:idRollingDoor});
            return ;
        }
        try
        {
//	await new Promise(resolve => setTimeout(resolve,5000));
        writeCMD({id:clientId,address:address,value: value});
//        const data = await client.readHoldingRegisters(address, 8);

        if (value === 1) {
            res.status(200).json({ msg: `Rolling Door Ditutup ` + address + " " + value });
        } else {
            res.status(200).json({ msg: `Kunci dengan address ${address} berhasil ditutup.` });
        }
    } catch (error) {
        if (error.name=="TransactionTimedOutError")
        {
            if (value === 1) {
                res.status(200).json({ msg: `Rolling Door Ditutup ` + address + " " + value });
            } else {
                res.status(200).json({ msg: `Kunci dengan address ${address} berhasil ditutup.` });
            }
    
        }
        else
            res.status(500).json({ msg: error,clientId:clientId,id:idRollingDoor });
    }
};

export const step4ActivedDoor = async (req,res) => {
    const {doorStatus, name} = req.body;
//    const container = await Container.findOne({attributes : ['containerId', 'name','station',"weightbin","idWaste",'clientId'],include:[{model:waste,as:'waste',required:true,duplicating:false,attributes:['name'], include:[{model:bin,as:'bin',required:true,duplicating:false,attributes:["name","id","type_waste"], where: { name: name }}] }] });
//    res.status(200).json([container,doorStatus ? 1: 0 ]);
    const _bin = await bin.findOne({
        attributes: ['clientId'],
        
        where: {'name': name}
    });
    if (!_bin)
    {
        res.status(500).json({msg:'Bin Not Found'});
        return;
    }
    let action = doorStatus ? 20 : 21;
    const val = 1;
    setTimeout(async ()=>{
        await Step4Check(name);
    },1);
    try
    {
        writeCMD({id:_bin.toJSON().clientId,address:action,value:val});
    if (doorStatus) {
        res.status(200).json({ msg: `Rolling Door Buka `,clientId: _bin.toJSON().clientId,address:action,value:val});
    } else {
        res.status(200).json({ msg: `Rolling Door Tutup`,clientId:_bin.toJSON().clientId,address:action,value:val });
    }
    }
    catch(err)
    {
        if (err.name=="TransactionTimedOutError")
        {
            if (doorStatus) {
                res.status(200).json({ msg: `Rolling Door Buka `,clientId: _bin.toJSON().clientId,address:action,value:val,plcres: 'PLC TIMED OUT'});
            } else {
                res.status(200).json({ msg: `Rolling Door Tutup`,clientId:_bin.toJSON().clientId,address:action,value:val,plcres: 'PLC TIMED OUT' });
            }
        }
        else
        {
        res.status(500).json({err:err.name,errMsg:err.message,clientId:_bin.toJSON().clientId,address:doorStatus ? 20 : 21,value:val});
        }
    }
}