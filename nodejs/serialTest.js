#!/usr/bin/env node

/*
serialDuplexTest.js
Tests the functionality of the serial port library.
To be used in conjunction with the Arduino sketch ArduinoEcho.ino
*/

/* 1. Ping (get version). 
static const uint8_t test_stream_ping[] = {
  0x23, 0x23, 0x00, 0x00, 0x00, 0x00, 0x00, 0x05, 0x0a, 0x03, 0x4d, 0x6f, 0x6f};
     ��Ŷ ����, (1,2)���� ������ #,
     3, 4���� message_id
     5,6,7,8 ���� ���� �޽���ũ�� ���� ����(8���� ǥ��)
     9�� ���Ĵ� ���� �޽��� 
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

var readlineHandle = readline.createInterface({
    input:process.stdin,
    output:process.stdout
});
readlineHandle.setPrompt('> ');


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
let tx_bytes_to_ack = new Int32Array();
// Remaining number of bytes that can be received before other side expects an
// acknowledge
let rx_bytes_to_ack;// = new Int8Array;



let filename = new String();// = new Array(256);
let newline;
//let abortVal;
//let packet_buffer;// = new Int8Array();
let packet_buffer;// = new Buffer();
let packet_buffer2;
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

//let output = 32; // ASCII space; lowest printable character
//let byteCount = 0; // number of bytes read

function onOpen() {
  console.log("Hardware BitCoin wallet tester\n");
  serialport.update({options:"57600"}, console.log("baudRate set as 57600"));

  tx_bytes_to_ack = DEFAULT_ACKNOWLEDGE_INTERVAL;
	rx_bytes_to_ack = 8;//DEFAULT_ACKNOWLEDGE_INTERVAL;

  // Get filename from user.
  console.log("Enter fileName to send (blank to quit): ");
  readlineHandle.resume();
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

          packet_buffer = data;
         // console.log("packet_buffer : ", packet_buffer.indexOf(0));
          console.log("packet_buffer.length : ", packet_buffer.length);
          console.log("packet_buffer.bytelength : ", packet_buffer.byteLength);
      
          displayPacket();
          console.log("Sending packet: ");
          // Send the packet.
          sendByte(fileSize);
      
        });
      
        fs.close(fd, (err) => {
          if (err) throw err;
        });

      });
    }
  });
}

let packet_buffer_received = Buffer.alloc(0);
let ack_buffer = Buffer.alloc(2);
let temp = Buffer.alloc(84);
let startOf0xff;
let chkLength;


// same fuction like streamGetOneByte() on ARV device
function onData(data) {       
  console.log("data : ", data);
  console.log("packet_buffer_recieved : ", packet_buffer_received);
  packet_buffer_received = Buffer.concat([packet_buffer_received,data]);

  console.log("rx_bytes_to_ack:  ",rx_bytes_to_ack)
  rx_bytes_to_ack--;
	if (!rx_bytes_to_ack)	{
    let bufferAsk = Buffer.alloc(4);
		rx_bytes_to_ack = 128;//�޽����� �ִ밪//RX_ACKNOWLEDGE_INTERVAL;
    //ack_buffer[0] = 0xff;
    serialport.write(Buffer.from('ff','hex'));

    bufferAsk.writeUInt32LE(rx_bytes_to_ack); // make as 4 bytes
    //bufferAsk.writeUInt32BE(rx_bytes_to_ack); // make as 4 bytes
    console.log(" bufferAsk: ",bufferAsk);
    serialport.write(bufferAsk);
  }
 
  startOf0xff = packet_buffer_received.indexOf(0xff);
  
  if (packet_buffer_received.length > 8 && startOf0xff != -1){
    temp = packet_buffer_received.slice(startOf0xff+5);
    console.log("temp : ", temp);
    console.log("temp.toString() : ", temp.toString('utf8'));
    if (temp.length > 9){      
      chkLength = temp.readUInt32BE(4);
      
      console.log("chkLengthBE > ",chkLength.toString(16));
      console.log("real message length => ", packet_buffer_received[5+8-1]);
  
      if(packet_buffer_received[5+8-1] != undefined && 
        packet_buffer_received[5+8-1] === packet_buffer_received.length-5-8 ){
       
        console.log("Receive Byte ");
        packet_buffer = temp;
        packet_buffer_received = 0;
        //console.log("packet_buffer_received.length0=> ",packet_buffer_received.length);
        displayPacket();
      }
    }
  }else{
    temp = packet_buffer_received;
    console.log("temp : ", temp);
    console.log("temp.toString() : ", temp.toString('utf8'));
    if (temp.length > 9){      
      chkLength = temp.readUInt32BE(4);
      
      console.log("chkLengthBE > ",chkLength.toString(16));
      console.log("real message length => ", packet_buffer_received[8-1]);
  
      if(packet_buffer_received[8-1] != undefined && 
        packet_buffer_received[8-1] === packet_buffer_received.length-8 ){
        console.log("Receive Byte ");
        packet_buffer = temp;
        packet_buffer_received = 0;
        //console.log("packet_buffer_received.length0=> ",packet_buffer_received.length);
        displayPacket();

        let rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout
        });
        // Get filename from user.
        console.log("Enter fileName to send (blank to quit): ");        
        
        rl.question("Input fileName ", function(answer){

          filename = answer;
          console.log("filename is ", filename);
          //readlineHandle.pause();
          rl.close();

          let regExp = /\\[0nr]| /gim; // \0 null, \n new line, \r carriage return
        
          console.log(" check : ", filename.search(regExp));

          if(filename.search(regExp) == -1 ){
            console.log(" search() ");
            fs.open(Buffer.from("testdata/"+filename),'r', (err,fd) => {
              if(err) throw err;
              
              fs.fstat(fd, (err, stat) => {
                if (err) throw err;
                fileSize = stat.size;
                console.log(" file size : ", fileSize);
              });

              fs.readFile("testdata/"+filename,(err, data) => {
                if (err) throw err;

                packet_buffer = data;
                // console.log("packet_buffer : ", packet_buffer.indexOf(0));
                console.log("packet_buffer.length : ", packet_buffer.length);
                console.log("packet_buffer.bytelength : ", packet_buffer.byteLength);
            
                displayPacket();
                console.log("Sending packet: ");

                sendByte(fileSize);
            
              });
            
              fs.close(fd, (err) => {
                if (err) throw err;
              });              
            });
          }
        });
      }
    }
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


function sendByte(file_length)
{
  let packet_bufferS = new Buffer(64);
  let data_size;
  let i;

  while (file_length > 0){
    data_size = file_length;
    if(data_size > 63){
      data_size = 63;
    }

    for(i=0; i<=data_size; i++){
      packet_bufferS[i] = packet_buffer[i];
      console.log(packet_bufferS[i].toString(16));
    }
    console.log("sendByte: ",packet_bufferS.toString());
    if (serialport.write(packet_bufferS,(error,bytesWritten) => {
      if (error) throw error;
      console.log(" written complete ",bytesWritten);
    }));
    file_length -= data_size;
    //console.log(" file_length => ", file_length);
  }
}

// Display packet contents on screen
function displayPacket() //packet_data, buffer_length)
{
	let command;
	let one_byte;
	let length;
  let i;

  command = ((packet_buffer[2] << 8) | packet_buffer[3]);
  // Read a 32-bit unsigned integer from the byte array specified by in.
  // The bytes will be read in a big-endian format.
  //length = packet_buffer.readUInt32LE(1);
  length = packet_buffer.readUInt32BE(4); // aggregate 4 bytes into 1 bytes
  //length = packet_buffer[4];
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
		one_byte = packet_buffer[i + 8];
		console.log(" 0x", one_byte.toString(16));
		if ((i + 8) >= packet_buffer.length) {
			console.log(" ***unexpected end of packet***");
			break;
		}
	}
	console.log("\n");
	// display ASCII
	for (i = 0; i < length; i++) {
		if (i && !(i & 15))	{
			console.log(" ");
		}
		one_byte = packet_buffer[i + 8];
		if ((one_byte < 32) || (one_byte > 126)) {
			console.log(".");
		}
		else {
			console.log( String.fromCharCode(packet_buffer[i + 8]));
		}
		if ((i + 8) >= packet_buffer.length) {
			break;
		}
	}
  console.log("\n");
}

// Convert command number into text string
function packetCommandToText(command) {
	switch (command) {
    case 0x00:
	  	return "Ping";
    case 0x04:
      return "NewWallet";
    case 0x05:
      return "NewAddress";
    case 0x06:
      return "GetNumberOfAddresses";
    case 0x09:
      return "GetAddressAndPublicKey";
    case 0x0a:
      return "SignTransaction";
    case 0x0b:
      return "LoadWallet";
    case 0x0d:
      return "FormatWalletArea";
    case 0x0e:
      return "ChangeEncryptionKey";
    case 0x0f:
      return "ChangeWalletName";
    case 0x10:
      return "ListWallets";
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
      return "ButtonRequest";
    case 0x51:
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