import { SerialPort } from 'serialport';


let currentWeight = 0;
let holdDelay = false;
export const getScales50Kg = (io) => {
	const Timbangan = new SerialPort({
		path: process.env.PORT_TIMBANGAN,//Note Diubah dari 1 ke 0.
		baudRate: 9600,
		dataBits: 8,
		stopBits: 1,
		parity: 'none',
	});
	console.log("Reading Scale From Port " + process.env.PORT_TIMBANGAN);
	if (Timbangan == null)
		return;
	try {
		let response;
		console.log("TEt");
		setInterval(function () {
			response = { weight50Kg: 20 };
			io.emit('data', response);
		}, 5000);
		io.on('connectScale', () => {
			console.log("reconnect scale");
			Timbangan.open(() => {
				console.log("opening port");
			});
		});
		Timbangan.on('data', (rawData) => {
			// console.log('Data Timbangan:', weight50Kg.toString());
			// Kirim data yang diterima sebagai respons ke clien
			try {
				console.log(rawData.toString());
				const arData = rawData.toString().split(',');
				let res = arData[arData.length-1];
				let val = res.trim().replace("Kg","");
				val = val.substring(1,val.length);
				console.log(val);
				val = parseFloat(val);
				if (res[0]=='-')
					val = val * -1;
				//            if ( Math.abs(currentWeight - parsed) < 0.5)
				//		return;
				currentWeight = val;
				response = { weight50Kg: val.toString() };
				io.emit('data', response);
			}
			catch (err) {
				console.log(err);
			}
		});

		Timbangan.on('error', (error) => {
			console.log(error);
		});

		if (response != undefined && response != null) {
			res.status(200).json(response);
		}
	} catch (error) {
		console.log(error);
		//      res.status(500).json({ msg: error.message });
	}
};


