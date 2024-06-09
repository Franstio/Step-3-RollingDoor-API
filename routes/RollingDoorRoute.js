import express from "express";
import {rollingdoorUp,rollingDoorDown,triggerAvailableBin, switchLampAPI,rollingDoorDownManualWeb,rollingdoorUpManualWeb} from "../controllers/TriggerRollingDoor.js"

const router = express.Router();


router.post('/rollingdoorUp', rollingdoorUp);
router.post('/rollingdoorDown',rollingDoorDown );
router.post('/rollingdoorUpmanual', rollingdoorUpManualWeb);
router.post('/rollingdoorDownmanual',rollingDoorDownManualWeb);
router.post('/triggerAvailbleBin',triggerAvailableBin);
router.get('/switchLamp',switchLampAPI);

export default router;