/*
serialDuplexTest.js
Tests the functionality of the serial port library.
To be used in conjunction with the Arduino sketch ArduinoEcho.ino
*/

/* 1. Ping (get version). 
static const uint8_t test_stream_ping[] = {
  0x23, 0x23, 0x00, 0x00, 0x00, 0x00, 0x00, 0x05, 0x0a, 0x03, 0x4d, 0x6f, 0x6f};
     패킷 구성, (1,2)번은 구분자 #,
     3, 4번은 message_id
     5,6,7,8 번은 실제 메시지크기 내용 전달(8번에 표기)
     9번 이후는 실제 메시지 
// 2. Is there a way to read the serialport input data using a function, not event emitter?
   Only Unix version is possible up to now.
   3. PC part(host) don't need to consider BigEndian and LittleEndian. 
      because this thing should be controlled by AVR part(device).
*/
'use strict';
const SerialPort = require('serialport');
const args = require('commander');
const fs = require('fs');
//const fsPromise = require('fs/promises');
//const fsPromise = require('fs').promises;
//var readline = require('node-readline.js');
var readline = require('readline');
var async = require('async');
const { StringDecoder } = require('string_decoder');
const str_decoder = new StringDecoder('utf8');

args
  .usage('-p <port>')
  .description('Run printable characters through the serial port')
  .option('-p, --port <port>', 'Path or Name of serial port. See serialportlist for available serial ports.')
  .parse(process.argv);

if (!args.port) {
  args.outputHelp();
  args.missingArgument('port');
  process.exit(-1);
}

// Maximum packet length to accept before program suspects the packet is
// garbled.
const PACKET_LENGTH_LIMIT	=	1000000;
// The default number of bytes (transmitted or received) in between
// acknowledgments
const DEFAULT_ACKNOWLEDGE_INTERVAL =	16;
// The number of received bytes in between acknowledgments that this program
// will use (doesn't have to be the default)
const RX_ACKNOWLEDGE_INTERVAL	=		32;

// Remaining number of bytes that can be transmitted before listening for
// acknowledge
let tx_bytes_to_ack;// = new Int32Array();
// Remaining number of bytes that can be received before other side expects an
// acknowledge
let rx_bytes_to_ack;// = new Int8Array;



let filename = new String();// = new Array(256);
let newline;
//let abortVal;
//let packet_buffer_file;// = new Int8Array();
let packet_buffer_file;// = new Buffer();
let fileSize;


const openOptions = Object.freeze({
  //autoOpen: true,
  baudRate: 57600,
  dataBits: 8,
  stopBits: 1,
  hupcl: true,
  lock: true,
  parity: 'none',
  rtscts: false,
  xany: false,
  xoff: false,
  xon: false,
  highWaterMark: 64 * 1024
});

const serialport = new SerialPort(args.port,openOptions); // open the serial port:

function callInputFilename(){
  var readlineHandle = readline.createInterface({
    input:process.stdin,
    output:process.stdout
  });
  readlineHandle.setPrompt('> ');
  // Get filename from user.
  console.log("Enter fileName to send (blank to quit): ");
  readlineHandle.question("Input fileName ", function(answer){

    filename = answer;
    console.log("filename is ", filename);
    //readlineHandle.pause();
    readlineHandle.close();

    let regExp = /\\[0nr]| /gim; // \0 null, \n new line, \r carriage return
  
    console.log(" check : ", filename.search(regExp));

    if(filename.search(regExp) == -1 ){
      console.log(" search() ");
      fs.open(Buffer.from("testdata/"+filename),'r+', (err,fd) => {
        if(err) throw err;
        
        fs.fstat(fd, (err, stat) => {
          if (err) throw err;
          fileSize = stat.size;
          console.log(" file size : ", fileSize);
        });

        fs.readFile("testdata/"+filename,(err, data) => {
          if (err) throw err;

          packet_buffer_file = data;
         // console.log("packet_buffer_file : ", packet_buffer_file.indexOf(0));
          console.log("packet_buffer_file.length : ", packet_buffer_file.length);
          console.log("packet_buffer_file.bytelength : ", packet_buffer_file.byteLength);
      
          displayPacket(data);
          console.log("Sending packet: ");
          // Send the packet.
          sendByte(data);        
        });
      
        fs.close(fd, (err) => {
          if (err) throw err;
        });

      });
    }
  });
}

function onOpen() {
  console.log("Hardware BitCoin wallet tester\n");
  serialport.update({options:"57600"}, console.log("baudRate set as 57600"));

  tx_bytes_to_ack = DEFAULT_ACKNOWLEDGE_INTERVAL;
  //rx_bytes_to_ack = 8;//DEFAULT_ACKNOWLEDGE_INTERVAL;
  rx_bytes_to_ack = DEFAULT_ACKNOWLEDGE_INTERVAL;
  callInputFilename(); 
}

let packet_buffer_received = Buffer.alloc(0);
let startOf0xff;
let temp = Buffer.alloc(84);
let callCheck0x23 = false;

function onData(data) {
  console.log("data : ", data);
  packet_buffer_received = Buffer.concat([packet_buffer_received,data]);
  console.log("packet_buffer_recieved : ", packet_buffer_received);
  console.log("packet_buffer_received.length:  ",packet_buffer_received.length)
  //tx_bytes_to_ack -= data.length;
  rx_bytes_to_ack -= data.length;
  console.log("rx_bytes_to_ack : ", rx_bytes_to_ack);
  console.log("tx_bytes_to_ack : ", tx_bytes_to_ack);
 
  startOf0xff = packet_buffer_received.indexOf(0xff);
  /*console.log("startOf0xff => ", startOf0xff)
  console.log("buf : ", packet_buffer_received[startOf0xff])
  console.log("buf+1 : ", packet_buffer_received[startOf0xff+1])
  if(packet_buffer_received[startOf0xff+1] === 0x80)
    console.log("Gaollllll ~~~~!!!!! ")*/
  
  if(startOf0xff != -1 && packet_buffer_received.length >= startOf0xff+5 
    && packet_buffer_received[startOf0xff+1] === 0x80){  
    console.log("request tx_bytes ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^")      
    let tx_chk = packet_buffer_received.slice(startOf0xff,5);
    let temp = packet_buffer_received.slice(startOf0xff+5);    
    packet_buffer_received = Buffer.alloc(temp.length,temp);

    console.log("tx_chk : ", tx_chk);
    
    // 상대에서 받을 수 있는 바이트량 받아오기
    // 첫 바이트 이후에 4 바이트를 32 word 로 만듦
    tx_bytes_to_ack = tx_chk.readUInt32LE(1);//offset + 4 bytes => make 1 bytes
  }
  let firstOf0x23 = packet_buffer_received.indexOf(0x23);
  //let secondOf0x23Buffer = packet_buffer_received.slice(firstOf0x23,1);
 // console.log("firstOf0x23", firstOf0x23)
//  console.log("secondOf0x23Buffer : ", secondOf0x23Buffer)
  /*if(secondOf0x23Buffer.toString()  === '#' &&
  packet_buffer_received[firstOf0x23+7] != undefined &&
  packet_buffer_received[firstOf0x23+7]+8 > packet_buffer_received.length &&
  callCheck0x23 != true && rx_bytes_to_ack < packet_buffer_received.length){*/
  if(callCheck0x23 != true && rx_bytes_to_ack <= 0 && 
    packet_buffer_received.length != packet_buffer_received[firstOf0x23+7]){
    callCheck0x23 = true;
    console.log("request rx_bytes ###########################################")
    let bufferAsk = Buffer.alloc(4);
		rx_bytes_to_ack = 128;//메시지중 최대값//RX_ACKNOWLEDGE_INTERVAL;
    serialport.write(Buffer.from('ff','hex'));

    bufferAsk.writeUInt32LE(rx_bytes_to_ack);//offset + 4 bytes => make 1 bytes
    console.log(" bufferAsk: ",bufferAsk);
    serialport.write(bufferAsk);
  }else if(packet_buffer_received[firstOf0x23+7]+8 === packet_buffer_received.length){
    console.log(" complete ")
    callCheck0x23 = false;
    displayPacket(packet_buffer_received);
    packet_buffer_received = Buffer.alloc(0);
    //tx_bytes_to_ack -= packet_buffer_received.length;
    //rx_bytes_to_ack -= packet_buffer_received.length;
    callInputFilename();
  }
}

function onClose() {
  console.log('port closed');
  fs.close(2);
  process.exit(1);
}

function onError(error) {
  console.log(`there was an error with the serial port: ${error}`);
  process.exit(1);
}

serialport.on('open', onOpen);
serialport.on('data', onData);
serialport.on('close', onClose);
serialport.on('error', onError);


async function sendByte(packet)
{
  if(serialport.write(packet,(error,bytesWritten) => {
    if (error) throw error;
    console.log(" written complete ",bytesWritten);
    tx_bytes_to_ack -= packet.length;
  }));
}

// Display packet contents on screen
function displayPacket(packet) //packet_data, buffer_length)
{
	let command;
	let one_byte;
	let length;
  let i;

  command = ((packet[2] << 8) | packet[3]);
  // Read a 32-bit unsigned integer from the byte array specified by in.
  // The bytes will be read in a big-endian format.
  //length = packet_buffer_file.readUInt32LE(1);
  length = packet.readUInt32BE(4); // aggregate 4 bytes into 1 word
  //length = packet_buffer_file[4];
  console.log("command : ", command.toString(16));
  console.log("length(hex) : ", length.toString(16));
  console.log("length(dec) : ", length.toString(10));
 
	console.log("command 0x",command.toString(16), packetCommandToText(command));
  console.log("Payload length(hex): ", length.toString(16));
  console.log("Payload length(dec): ", length.toString(10));
 
	// display hex bytes
	for (i = 0; i < length; i++) {
		if (i && !(i & 15))	{
			console.log("\n");
		}
		//one_byte = packet[i + 8];
		//console.log(" 0x", one_byte.toString(16));
		if ((i + 8) >= packet.length) {
			console.log(" ***unexpected end of packet***");
			break;
		}
	}
	console.log("\n");
	// display ASCII
	for (i = 0; i < length; i++) {
		if (i && !(i & 15))	{   // add a space every 16 line
			console.log(" ");
    }
    /*
    one_byte = packet[i + 8].toString(16);
    if(one_byte < 10)
      console.log("0"+one_byte);
    else
      console.log(one_byte);
  */

    console.log( String.fromCharCode(packet[i + 8].toString(10)),"   ",one_byte,
      '   ',packet[i + 8].toString(16),'    ',
      str_decoder.write('0x'+ packet[i+8].toString(16)));


    /*
		if ((one_byte < 32) || (one_byte > 126)) {
      //console.log(". "); 
      console.log( String.fromCharCode(packet[i + 8].toString(10)),"   ",one_byte,
      '   ',packet[i + 8].toString(16),'    ',
      str_decoder.write('0x'+ packet[i+8].toString(16)));
		}
		else {
      console.log( String.fromCharCode(packet[i + 8].toString(10)),"   ",one_byte,
      '   ',packet[i + 8].toString(16),'    ',
      str_decoder.write('0x'+ packet[i+8].toString(16)));
    }
    */
		if ((i + 8) >= packet.length) {
			break;
		}
  }
  console.log("\n");
 // console.log(packet.);
}

// Convert command number into text string
function packetCommandToText(command) {
	switch (command) {
    case 0x00:
      return "Ping";
case 0x01:
  return "acknowledge ping";
case 0x02:
  return "return success";
case 0x03:
  return "return failure";
    case 0x04:
      return "create new wallet";
    case 0x05:
      return "create new address in wallet";
    case 0x06:
      return "GetNumberOfAddresses";
    case 0x09:
      return "GetAddressAndPublicKey";
    case 0x0a:
      return "Sign Transaction";
    case 0x0b:
      return "Load Wallet";
    case 0x0c:
      return "unload wallet";
    case 0x0d:
      return "Format Walle tArea";
    case 0x0e:
      return "Change EncryptionKey";
    case 0x0f:
      return "Change WalletName";
    case 0x10:
      return "List Wallets";
    case 0x11:
      return "BackupWallet";
    case 0x12:
      return "RestoreWallet";
    case 0x13:
      return "GetDeviceUUID";
    case 0x14:
      return "GetEntropy";
    case 0x15:
      return "GetMasterPublicKey";
    case 0x16:
      return "DeleteWallet";
    case 0x17:
      return "Initialize";
    case 0x30:
      return "Address";
    case 0x31:
      return "NumberOfAddresses";
    case 0x32:
      return "Wallets";
    case 0x33:
      return "PingResponse";
    case 0x34:
      return "Success";
    case 0x35:
      return "Failure";
    case 0x36:
      return "DeviceUUID";
    case 0x37:
      return "Entropy";
    case 0x38:
      return "MasterPublicKey";
    case 0x39:
      return "Signature";
    case 0x3a:
      return "Features";
    case 0x50:
      console.log(" Ready to do Button press. ")
      return "ButtonRequest";
    case 0x51:
      console.log("Press Button on bread board. ")
      return "ButtonAck";
    case 0x52:
      return "ButtonCancel";
    case 0x53:
      return "PinRequest";
    case 0x54:
      return "PinAck";
    case 0x55:
      return "PinCancel";
    case 0x56:
      return "OtpRequest";
    case 0x57:
      return "OtpAck";
    case 0x58:
      return "OtpCancel";
    default:
      return "unknown";
	}
}