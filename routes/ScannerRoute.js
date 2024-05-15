import express from "express";
import {ScanBadgeid,ScanContainer,SaveTransaksi,UpdateBinWeight,CheckBinCapacity} from "../controllers/Employee.js"

const router = express.Router();

router.post('/ScanBadgeid', ScanBadgeid);
router.post('/ScanContainer', ScanContainer);
router.post("/SaveTransaksi",SaveTransaksi);
router.post('/UpdateBinWeight',UpdateBinWeight)
router.post('/CheckBinCapacity',CheckBinCapacity)
export default router;