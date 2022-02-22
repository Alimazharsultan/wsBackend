const server = require('http').createServer();
const mongoose = require('mongoose')
const EntryModel = require('./models/location3data')
//For Mqtt
const mqtt = require("mqtt");
require('dotenv').config();

let sendData = 0;
let ACValue = 0;


const io= require('socket.io')(server,{
    transports: ['websocket', 'polling']
  });

  //Variables
var tempS = '';
var humidityS = '';
var pressureS = '';
var lumS = '';
// var timeFormated = '';

//Connecting to mqtt
var options={
      port: "1883",
      protocol: "mqtt",
      clientId: "mqttjs01",
      hostname: "broker.hivemq.com",
    };
var client = mqtt.connect(options);
client.subscribe("AIEMSL1/temperature");
client.subscribe("AIEMSL1/humidity");
client.subscribe("AIEMSL1/pressure");
client.subscribe("AIEMSL1/luminance"); 
// console.log("connected  "+client.connected);
io.on("AC", (message)=>{
    console.log('recieved:')
})
client.on('message', function(topic, msg){
  console.log(topic+" Message Recieved -> "+msg.toString());
  
  if(topic.toString()==="AIEMSL1/temperature"){
    tempS = msg.toString();
    sendData++;
      }
  if(topic.toString()==="AIEMSL1/humidity"){
    humidityS = msg.toString();
    sendData++;
  }
  if(topic.toString()==="AIEMSL1/pressure"){
    pressureS = msg.toString();
    sendData++;
  }
  if(topic.toString()==="AIEMSL1/luminance"){
    lumS = msg.toString();
    sendData++;
  }
  //Send Data to ac
  if(ACValue!=0){
    if(client.connected){
      client.publish('AIEMSL1/ACD', ACValue.toString(),opts=options);
      console.log('Ac Value sent');
      
    }else{
      console.log('Ac Value not sent');
    }
    ACValue=0
  }
  
  // emit to sockets.io
  io.emit('cpu',{ temp: tempS, humidity: humidityS, pressure: pressureS, lum: lumS });
  console.log(sendData);
  if(sendData===4){
    
    const event = new EntryModel({
      readingtime: new Date().toISOString(),
      temperature: tempS,
      humidity: humidityS,
      pressure: pressureS,
      altitude: lumS,
      temperature_status: "Coming Soon",
      humidity_status: "Coming Soon",
      pressure_status: "Coming Soon",
    });
    return event.save().then((r)=>{
      console.log('saved to database');
      sendData=0;
    }    
    ).catch(err=>{
      console.log('Error saving to database');
            });  
    // axios.post("http://localhost:3001/createEntry", {
    //           readingtime: date_ob,
    //           temperature: tempS,
    //           humidity: humidityS,
    //           pressure: pressureS,
    //           altitude: lumS,
    //           temperature_status: "Coming Soon",
    //           humidity_status: "Coming Soon",
    //           pressure_status: "Coming Soon",
    //         }).then((response) => {
    //           console.log('Data Sent')
    //           sendData=0;
    //       }).catch(err=>{
    //         throw err;
    //       });   
  }
})

setInterval(()=>{
  if(sendData===0){
    io.emit('cpu',{value: 'NaN'});
   
    console.log('values reset')
  }
  sendData=0;
 
  }, 60000);
io.on("connection", (socket) => {
//   console.log('MQTT connection established')
  if(tempS!=0 && humidityS!=0){
    io.emit('cpu',{ temp: tempS, humidity: humidityS, pressure: pressureS, lum: lumS });
  }
  
  socket.on("AC",(m)=>{
    if(client.connected){
        client.publish('AIEMSL1/ACD', m.value.toString(),opts=options);
        console.log('Ac Value sent');
        ACValue = 0;
        
      }else{
        ACValue = m.value;
      }
})
});


mongoose
  .connect(
    `mongodb+srv://ali:great@cluster0.p3ddg.mongodb.net/merntutorial?retryWrites=true&w=majority`
  )
  .then(() => {
    console.log('Database Server Running')
       server.listen(process.env.PORT|| 4002, () => {
      console.log("Sockets Server Running");
    });
    
    
  })
  .catch(err => {
    console.log(err);
  });