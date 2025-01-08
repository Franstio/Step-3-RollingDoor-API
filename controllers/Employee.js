import Users from "../models/EmployeeModel.js"
import Container from "../models/ContainerModel.js"
import waste from "../models/WesteModel.js";
import transaction from "../models/TransactionModel.js"
import bin from "../models/BinModel.js";
import moment from 'moment';
import { ToggleRollingDoor } from "./TriggerRollingDoor.js";
import db from "../config/db.js";   
import axios from 'axios';
import { QueryTypes, Transaction } from "sequelize";
import { employeeQueue, pendingQueue, weightbinQueue } from "../index.js";
//import { switchLamp } from "../Lib/PLCUtility.js";
const apiClient = axios.create({
    withCredentials: false,
    timeout: 1000,
});
export const ScanBadgeid = async (req, res) => {
    const { badgeId } = req.body;
    try {
        const user = await Users.findOne({ attributes: ['badgeId',"username"], where: { badgeId:badgeId,active:1 } });
        employeeQueue.add({id:1},{removeOnFail:{age: 60*10,count:10},timeout:5000,removeOnComplete:{age:60,count:5}});
        if (user) {
            res.json({ user: user });
        } else {
            res.json({ error: 'Badge ID not found' });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: 'Terjadi kesalahan server'  });
    }
};

export const ScanContainer = async (req, res) => {
    const { containerId } = req.body;
    try {
        weightbinQueue.add({id:2},{removeOnFail:{age: 60*10,count:10},timeout:5000,removeOnComplete:{age:60,count:5}});
        const container = await Container.findOne({attributes : ['containerId', 'name','station',"weightbin","step2value","idWaste"],include:[{model:waste,as:'waste',required:true,duplicating:false,attributes:['name'], include:[{model:bin,as:'bin',required:true,duplicating:false,attributes:["name","id","type_waste"]}] }], where: { name: containerId } });
        if (container) {
            res.json({ container:container });
        } else {
            res.json({ error: 'Container ID not found' });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: 'Terjadi kesalahan server' });
    }
};
export const SaveTransaksi = async (req,res) => {
    await new Promise((resolve) => {
        setTimeout(resolve, 500);
    });
    const {payload} = req.body;
    const tr =await db.transaction({isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE});
    const state = [];
    try
    {
        for (let i=0;i<payload.length;i++)
        {
            payload[i].recordDate = moment().format("YYYY-MM-DD HH:mm:ss");
            state.push(await transaction.create(payload[i],{transaction:tr}));
            await db.query(`Update container set step2value=0 where name='${payload[i].containerName}';`,
            {transaction: tr});
        }
        await tr.commit();
        pendingQueue.add({id:3},{removeOnFail:{age: 60*10,count:10},timeout:5000,removeOnComplete:{age:60,count:5}});
        res.status(200).json({msg:state});
    }
    catch (er)
    {
        console.log(er.message || er);
        await tr.rollback();
        res.status(500).json({msg:"Transaction Cancelled",err:er.message || er});
    }
}
export const UpdateBinWeight = async (req,res) =>{
    const {binId,neto} = req.body;
    const data = await bin.findOne({where: {id:binId}});
    data.weight = parseFloat(neto) + parseFloat(data.weight);
    data.save();
    await ToggleRollingDoor(data.clientId,false);
   // await switchLamp(data.id,"RED",data.weight >= parseFloat(data.max_weight))
    res.status(200).json({msg:'ok'});
}
export const SyncTransaction = async ()=>{
    const data = await db.query("Select t.id,t.badgeId,t.status,t.isSuccess,t.containerName,t.binName,t.neto,c.weightbin,c.step2value from transaction t left join container c on t.idContainer=c.containerId where t.status like '%PENDING%';");
    if (!data || data.length < 1)
        return data;
    const pending = data[0];
    if (!pending || pending.length<1 )
        return pending;
    
    const rackTargetName = process.env.RACK_TARGET_CONTAINER;
    const rackTargets = rackTargetName.split(",");
    for (let i=0;i<pending.length;i++)
    {
        const status = pending[i].status.split('|');
        if (!status || status.length < 3  )
            continue;
        let level = parseInt(status[2]);
        try
        {
            
            //if (  rackTargets.includes(pending[i].name))
            if (level ==1)
            {
                try
                {
                    const weightResponse = await apiClient.post(`http://${process.env.PIDSG}/api/pid/sendWeight`,{
                                binname: pending[i].binName,
                                weight: pending[i].step2value
                    });
                }
                catch (er)
                {
                    console.log(er.message || er);
                    status[2] = 1;
                    pending[i].status  = 'Pending|PIDSG|1';
                    pending[i].isSuccess = false;        
                    await db.query(`Update transaction set status='${pending[i].status}',isSuccess=${pending[i].isSuccess ? 1 : 0 } where id='${pending[i].id || pending[i].Id}' `);                    
                    continue;
                }
                status[2] =2;
                level = 2;
            }
            if (level == 2)
            {
                try
                {
                const response = await apiClient.post(`http://${process.env.PIDSG}/api/pid/activityLogTempbyPc`, {
                    badgeno: pending[i].badgeId,
                    stationname: "STEP 3 COLLECTION",
                    frombin: pending[i].containerName,//"2-PCS-5",
                    weight: parseFloat(pending[i].neto) + parseFloat(pending[i].weightbin),
                    activity: 'Movement by System',
                    filename: null,
                    postby: "Local Step 3"

                });
                    if (!response.data.success)
                    {
                        status[2] = 2;
                        pending[i].status  = 'Pending|PIDSG|2';
                        pending[i].isSuccess = false;        
                        await db.query(`Update transaction set status='${pending[i].status}',isSuccess=${pending[i].isSuccess ? 1 : 0 } where id='${pending[i].id || pending[i].Id}' `);
                        continue;
                    }
                }
                catch (err)
                {
                    console.log(err.message || err);
                    status[2] = 2;
                    pending[i].status  = 'Pending|PIDSG|2';
                    pending[i].isSuccess = false;        
                    await db.query(`Update transaction set status='${pending[i].status}',isSuccess=${pending[i].isSuccess ? 1 : 0 } where id='${pending[i].id || pending[i].Id}' `);
                    continue;
                }
                level =3;
                status[2]=3;
            }
            if (level ==3)
            {
                try
                {

                    const response2 = await apiClient.post(`http://${process.env.PIDSG}/api/pid/activityLogbypc`, {
                        stationname: "STEP 3 COLLECTION",
                        frombin: pending[i].containerName,
                        tobin: pending[i].binName ,
                    });
                    if (!response2.data.success)
                    {
                        pending[i].status  = 'Pending|PIDSG|3';
                        pending[i].isSuccess = false;
                        await db.query(`Update transaction set status='${pending[i].status}',isSuccess=${pending[i].isSuccess ? 1 : 0 } where id='${pending[i].id || pending[i].Id}' `);
                        continue;
                    }
                }
                catch (err)
                {
                    console.log(err.message || err);
                    status[2] = 3;
                    pending[i].status  = 'Pending|PIDSG|3';
                    pending[i].isSuccess = false;        
                    await db.query(`Update transaction set status='${pending[i].status}',isSuccess=${pending[i].isSuccess ? 1 : 0 } where id='${pending[i].id || pending[i].Id}' `);
                    continue;
                }
            }
            pending[i].status  ='Done';
            pending[i].isSuccess = true;
//            console.log([pending[i],[response.status,response.data],[response2.status,response2.data],[weightResponse.status,weightResponse.data]]);
        }
        catch(err)
        {
            pending[i].status  = 'Pending|PIDSG|1';
            pending[i].isSuccess = false;
            console.log(err?.message|| 'ERROR');
        }
        
        await db.query(`Update transaction set status='${pending[i].status}',isSuccess=${pending[i].isSuccess ? 1 : 0 } where id='${pending[i].id || pending[i].Id}' `);
    }
    return pending;
}
export const SyncAPI =async (req,res) =>
{
    const data = await SyncTransaction();
    return res.json({msg:data});
}
export const CheckBinCapacity = async (req, res) => {
    const { type_waste, neto } = req.body;

    try {
        // Mengambil semua tempat sampah yang sesuai dengan type_waste dari database
        const bins = await bin.findAll({
            where: {
                type_waste: type_waste
            }
        });

        // Jika tidak ada tempat sampah yang ditemukan untuk type_waste yang diberikan
        if (!bins || bins.length === 0) {
            return res.status(404).json({ success: false, message: 'No bins found for the given waste type' });
        }

        // Menyaring tempat sampah yang memiliki kapasitas cukup untuk neto
        let eligibleBins = bins.filter(bin => (parseFloat(bin.weight) + parseFloat(neto)) <= parseFloat(bin.max_weight));

        // Jika tidak ada tempat sampah yang memenuhi kapasitas
        if (eligibleBins.length === 0) {
            return res.status(200).json({ success: false, message: 'No bins with enough capacity found' });
        }

        // Mengurutkan tempat sampah berdasarkan kapasitas yang hendak penuh terlebih dahulu
        eligibleBins = eligibleBins.sort((a, b) =>  (parseFloat(a.max_weight) - (parseFloat(a.weight) + parseFloat(neto))) -    (parseFloat(b.max_weight) - (parseFloat(b.weight) + parseFloat(neto))));
        // Memilih tempat sampah yang hendak penuh
        let selectedBin = eligibleBins[0];
        let remainingNeto = neto;

     /*    while (selectedBin && remainingNeto > 0) {
            const availableCapacity = selectedBin.max_weight - selectedBin.weight;
            
            if (remainingNeto <= availableCapacity) {
                selectedBin.weight += remainingNeto;
                remainingNeto = 0;
            } else {
                selectedBin.weight += availableCapacity;
                remainingNeto -= availableCapacity;
                eligibleBins.shift(); // Menghapus bin yang sudah penuh dari daftar
                selectedBin = eligibleBins[0]; // Memilih bin berikutnya
            }
        } */

        if (eligibleBins.length < 1) {
            return res.status(200).json({ success: false, message: 'Not enough capacity in any bins' });
        }
        console.log(selectedBin.clientId);
        await ToggleRollingDoor(selectedBin.clientId,true);
        res.status(200).json({ success: true, bin: selectedBin });
    } catch (error) {
        console.log('Error checking bin capacity:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

export const UpdateStep2Value = async (req,res)=>{
    const {value,fromRack} = req.body;
    const {containerName} = req.params;
    const _container = await Container.findOne({where:{
        name: containerName
    }});
    if (!_container)
        return res.status(404).json('Container Not Found');
    _container.step2value = parseFloat(value)+ parseFloat(_container.step2value ??0);
//    _container.step2value = fromRack ? parseFloat(value) : (parseFloat(value) + _container.step2value);
    await _container.save();
    return res.status(200).json({msg:'ok'});
}
export const syncEmployeePIDSGAPI = async (req,res)=>{
    return res.json(await syncEmployeePIDSG());
}

export const syncEmployeePIDSG = async ()=>{
    try
    {
        const apiRes = await apiClient.get(
            `http://${process.env.PIDSG}/api/pid/employee-sync?f1=${process.env.STATION}`);
        const syncEmp = apiRes.data.result[0];
        const apiEmpBadgeNo= [];
        for (let i=0;i<syncEmp.length;i++)
        {
            if (syncEmp[i].OUT >= 1)
            {
                const empRes = await db.query("Select badgeId,username from employee where badgeId=?",{type:QueryTypes.SELECT,replacements:[syncEmp[i].badgeno]});
                apiEmpBadgeNo.push(`'${syncEmp[i].badgeno}'`);
                if (empRes.length < 1)
                {
                    await db.query("Insert Into employee(username,active,badgeId) values(?,1,?)",
                    {
                        type:QueryTypes.INSERT,
                        replacements: [syncEmp[i].employeename,syncEmp[i].badgeno]
                    }); 
                }
                else
                {
                    await db.query("Update employee set username=?,active=1 where badgeId=?",{
                        type: QueryTypes.UPDATE,
                        replacements: [syncEmp[i].employeename,syncEmp[i].badgeno]
                    })
                }
            }
        }
        if (syncEmp.length > 0)
        {
        await db.query("Update employee set active=0 where badgeId not in ("+apiEmpBadgeNo.join(",")+")",{
            type: QueryTypes.UPDATE,
          });
        }
        return syncEmp;
    }
    catch (er)
    {
        console.log(er);
        return  er.message || er;
    }
}
export const syncPIDSGBin = async()=>{
    try
      {
          const dataBin = await db.query(" select b.id,b.name,c.station from bin b left join container c on b.name=c.name",{
          type: QueryTypes.SELECT
          });
          const binNames = dataBin.map(x=>x.name); 
          console.log(
            `http://${process.env.PIDSG}/api/pid/bin-sync?f1=${JSON.stringify(binNames)}`);
          const apiRes = await axios.get(
              `http://${process.env.PIDSG}/api/pid/bin-sync?f1=${JSON.stringify(binNames)}`);
          const syncBin = apiRes.data.result[0];
          for (let i=0;i<syncBin.length;i++)
          {
              await db.query("update bin b left join container c on b.name=c.name  set max_weight=? where b.name=? ",{
                      type: QueryTypes.UPDATE,
                      replacements: [syncBin[i].capacity,syncBin[i].name]
                  })
          }
          return syncBin;
      }
      catch (er)
      {
          console.log(er);
          return  er.message || er;
      }
}
export const syncAll = async (req,res)=>{
    
  await SyncTransaction();
  await syncEmployeePIDSG();
  await syncPIDSGBin();
  await syncPIDSGContainer();
  return res.json({msg:"ok"},200);
}
  
export const syncPIDSGBinAPI = async (req,res)=>{
    return res.json(await syncPIDSGBin());
  }

  export const syncPIDSGContainer = async()=>{
    try
      {
          const dataBin = await db.query(" select containerid,name,station,weightbin from container",{
          type: QueryTypes.SELECT
          });
          const binNames = dataBin.map(x=>x.name); 
          console.log(
            `http://${process.env.PIDSG}/api/pid/bin-sync?f1=${JSON.stringify(binNames)}`);
          const apiRes = await axios.get(
              `http://${process.env.PIDSG}/api/pid/bin-sync?f1=${JSON.stringify(binNames)}`);
          const syncBin = apiRes.data.result[0];
          for (let i=0;i<syncBin.length;i++)
          {
              await db.query("update container set weightbin=? where name=? ",{
                      type: QueryTypes.UPDATE,
                      replacements: [syncBin[i].weight,syncBin[i].name]
                  })
          }
          return syncBin;
      }
      catch (er)
      {
          console.log(er);
          return  er.message || er;
      }
}
  
export const syncPIDSGBinContainerAPI = async (req,res)=>{
    return res.json(await syncPIDSGContainer());
  }