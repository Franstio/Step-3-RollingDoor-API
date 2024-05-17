import express from "express";
import {rollingdoorUp,rollingDoorDown,triggerAvailableBin, switchLampAPI} from "../controllers/TriggerRollingDoor.js"

const router = express.Router();


router.post('/rollingdoorUp', rollingdoorUp);
router.post('/rollingdoorDown',rollingDoorDown );
router.post('/triggerAvailbleBin',triggerAvailableBin);
router.get('/switchLamp',switchLampAPI);

export default router;