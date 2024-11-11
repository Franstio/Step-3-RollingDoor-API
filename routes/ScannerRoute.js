import express from "express";
import {ScanBadgeid,ScanContainer,SaveTransaksi,UpdateBinWeight,CheckBinCapacity, SyncAPI, syncEmployeePIDSGAPI} from "../controllers/Employee.js"

const router = express.Router();

router.post('/ScanBadgeid', ScanBadgeid);
router.post('/ScanContainer', ScanContainer);
router.post("/SaveTransaksi",SaveTransaksi);
router.post('/UpdateBinWeight',UpdateBinWeight)
router.post('/CheckBinCapacity',CheckBinCapacity)
router.get('/SyncPending',SyncAPI);
router.get('/employee-sync',syncEmployeePIDSGAPI);
export default router;