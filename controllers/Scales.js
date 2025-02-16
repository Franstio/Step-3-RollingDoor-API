import { SerialPort } from 'serialport';
import { io,  scaleQueue } from '../index.js';
import { delay } from 'ethernet-ip/src/utilities/index.js';


export const getScales50Kg = () => {
	
	try {
	const Timbangan = new SerialPort({
		path: process.env.PORT_TIMBANGAN,//Note Diubah dari 1 ke 0.
		baudRate: 9600,
		lock:false,
		dataBits: 8,
		stopBits: 1,
		parity: 'none',
	});
//	console.log("Timbangan PORT: "+ process.env.PORT_TIMBANGAN);

//		Timbangan.open();
		Timbangan.on('data', (rawData) => {
			// Kirim data yang diterima sebagai respons ke clien
			try {
				const arData = rawData.toString().split(',');
				let res = arData[arData.length-1];
				let val = res.trim().replace("+","").replace("Kg","");
				val = val.substring(1,val.length);
				val = parseFloat(val);
				if (res[0]=='-')
					val = val * -1;
				//            if ( Math.abs(currentWeight - parsed) < 0.5)
				//		return;
				//currentWeight = val;
				const response = { weight50Kg: val.toString() };
				io.emit('data', response);
			}
			catch (err) {
				console.log('1');
				console.log(err);
				Timbangan.close(()=>
				scaleQueue.add({type:'scale',from: `Scale:Error Failed Parse ${rawData.toString()} `},{delay:1000,removeOnFail:{age: 60*10,count:10},timeout:3000,removeOnComplete:{age:60,count:5}}));
				return;
			}
		});

		Timbangan.on('error', (error) => {
		//	console.log({kg50error:error});

			console.log(error.message);		
			Timbangan.close(()=>
			scaleQueue.add({type:'scale',from: 'Scale:Error'},{
				delay: 3000,
				removeOnFail:{age: 60*10,count:10},timeout:3000,removeOnComplete:{age:60,count:5}
			}));
		});

	} catch (error) {
		console.log('3');
		scaleQueue.add({type:'scale',from: 'Scale:Error 2'},{
			delay: 3000,
			removeOnFail:{age: 60*10,count:10},timeout:3000,removeOnComplete:{age:60,count:5}
		});
	}
};


