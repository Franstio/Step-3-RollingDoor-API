import express from "express";
import rateLimit from "express-rate-limit";
import {ScanBadgeid,ScanContainer,SaveTransaksi,UpdateBinWeight,CheckBinCapacity, SyncAPI, syncEmployeePIDSGAPI, syncPIDSGBinAPI, syncPIDSGContainer, syncPIDSGBinContainerAPI, syncAll} from "../controllers/Employee.js"
import { plcQueue,pendingQueue,weightbinQueue,employeeQueue,scaleQueue } from "../index.js";
const router = express.Router();
const transactionRateLimit = rateLimit({
    max:1,
    windowMs: 1000,
    message: "Transaction In Running"
  }); 
router.post('/ScanBadgeid', ScanBadgeid);
router.post('/ScanContainer', ScanContainer);
router.post("/SaveTransaksi",transactionRateLimit,SaveTransaksi);
router.post('/UpdateBinWeight',UpdateBinWeight)
router.post('/CheckBinCapacity',CheckBinCapacity)
router.get('/SyncPending',SyncAPI);
router.get('/employee-sync',syncEmployeePIDSGAPI);
router.get('/bin-sync',syncPIDSGBinAPI);
router.get('/container-sync',syncPIDSGBinContainerAPI);
router.get('/sync-all',syncAll);
router.get('/ping',(req,res)=>res.json({msg:"ok"}));
router.get('/clean',(req,res)=>{
    plcQueue.obliterate({force:true});
    scaleQueue.obliterate({force:true});
    pendingQueue.obliterate({force:true});
    employeeQueue.obliterate({force:true});
    weightbinQueue.obliterate({force:true});
    return res.json({msg:"ok"},200);
});
router.get('/start-work',(req,res)=>{
    scaleQueue.add({type:'scale'});
    plcQueue.add({type:'plc'});
    return res.json({msg:'ok'},200);
})
export default router;