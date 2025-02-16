import './env.js';
import express from "express";
import RollingDoorRoute from "./routes/RollingDoorRoute.js";
import ScannerRoute from "./routes/ScannerRoute.js";
import cors from  "cors";
import ScalesRoute from "./routes/ScalesRoute.js";
import http from 'http';
import { Server } from "socket.io";
import db from "./config/db.js";
import bodyParser from "body-parser";
import { syncEmployeePIDSG, syncPIDSGBin, syncPIDSGContainer, SyncTransaction } from './controllers/Employee.js';
import client, { writeCMD, writePLC } from './Lib/PLCUtility.js';
import { getScales50Kg } from './controllers/Scales.js';
import Queue from 'bull';
import { ExpressAdapter } from '@bull-board/express';
import {createBullBoard} from '@bull-board/api';
import {BullAdapter} from '@bull-board/api/bullAdapter.js';
const app = express();
const server = http.createServer(app);

try {
  await db.authenticate();
  console.log('Database terhubung..');
  
} catch (error) {
  console.log(error);
  
}

const port = 5000;
app.use(cors({
  credentials: false,
  origin: '*'
}));

app.use(bodyParser.json());

const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

const [plcCommandQueue,scaleQueue,pendingQueue,employeeQueue,weightbinQueue]
 = [Queue('PLC Command Queue'),Queue('Scale Queue',{limiter:{max:3,duration:1000}}),Queue('Pending Transaction Queue'),Queue('Employee Sync Queue'),Queue('Weightbin Queue')];

 plcCommandQueue.process( async (job,done)=>{
    const res = await writePLC(job.data);
    if (res.success)
      done(null,res);
    else
    {
      writeCMD(job.data);
      done(res.res,null);
    }
 })


scaleQueue.process((job,done)=>{
  console.log(job.data.from || '');
	getScales50Kg();
	done();
});
pendingQueue.process(async (job,done)=>{
  const res = await SyncTransaction();
  done(null,res);
});
employeeQueue.process(async(job,done)=>{
  const res = await syncEmployeePIDSG();
  done(null,res);
});
weightbinQueue.process(async(job,done)=>{
  const res1= await syncPIDSGContainer();
  const res2= await syncPIDSGBin();
  done(null,[res1,res2]);
});

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/queues');
const bullBoard = createBullBoard({
  queues: [new BullAdapter(plcCommandQueue),new BullAdapter(scaleQueue),new BullAdapter(pendingQueue),new BullAdapter(employeeQueue),new BullAdapter(weightbinQueue)],
  serverAdapter: serverAdapter,
  options:{
    uiConfig:{
      boardTitle:"Step 3 Task Queues"
    }
  }
});
app.use('/queues',serverAdapter.getRouter());
export { Server, io,scaleQueue,plcCommandQueue,employeeQueue,weightbinQueue,pendingQueue };

app.use(RollingDoorRoute);
app.use(ScannerRoute);
app.use(ScalesRoute);


 io.on('connection', (socket) => {
  console.log('Client connected');
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
}); 

server.listen(port, () => {
  pendingQueue.add({id:1},{removeOnFail:{age: 60*10,count:10},timeout:5000,removeOnComplete:{age:60,count:5}});
  employeeQueue.add({id:2},{removeOnFail:{age: 60*10,count:10},timeout:5000,removeOnComplete:{age:60,count:5}});
  weightbinQueue.add({id:3},{removeOnFail:{age: 60*10,count:10},timeout:5000,removeOnComplete:{age:60,count:5}});
  scaleQueue.add({type:'scale',from:'index'},{removeOnFail:{age: 60*10,count:10},timeout:3000,removeOnComplete:{age:60,count:5}});
  console.log(`Server up and running on port ${port}`);
});
console.log("check max weight");
//checkMaxWeight();