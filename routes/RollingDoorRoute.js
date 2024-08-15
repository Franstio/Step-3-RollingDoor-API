import express from "express";
import {rollingdoorUp,rollingDoorDown,triggerAvailableBin, switchLampAPI,rollingDoorDownManualWeb,rollingdoorUpManualWeb, step4ActivedDoor} from "../controllers/TriggerRollingDoor.js"
import { UpdateStep2Value } from "../controllers/Employee.js";

const router = express.Router();


router.post('/rollingdoorUp', rollingdoorUp);
router.post('/rollingdoorDown',rollingDoorDown );
router.post('/rollingdoorUpmanual', rollingdoorUpManualWeb);
router.post('/rollingdoorDownmanual',rollingDoorDownManualWeb);
router.post('/triggerAvailbleBin',triggerAvailableBin);
router.get('/switchLamp',switchLampAPI);
router.post('/activedDoor',step4ActivedDoor);
router.put('/step2value/:containerName',UpdateStep2Value);
export default router;