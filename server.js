var express=require('express');
var http=require('http');
var nodemailer = require("nodemailer");
var app=express();
var xml2js =require('xml2js');
var port = process.env.PORT || 3000;
// var replaceall = require("replaceall");
var fs = require('fs');
var xml2js = require('xml2js');
// const SMA = require('technicalindicators').SMA;
var monitorGraphTimer = 40000;

var smtpTransport = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    auth: {
        user: 'tharaka.ranwaththa@gmail.com',
        pass: 'zlunbwisjmtwyquz'
    },
    tls: {rejectUnauthorized: false},
    debug:true
});


app.listen(port,function(){
	console.log("Server starts " + port);
});


/*------------------SMTP Over-----------------------------*/

/*------------------Routing Started ------------------------*/
var monitorRateList= new Array();

app.get('/telMeWhen',function(req,result){
	console.log('I ll email you:P');
	var unit = req.query.unit;
	var type = req.query.type;
	var rate = req.query.rate;
	var monitorRate;

	monitorGraph(function(err,result){

		result.Rates.Rate.forEach(function(item){
			var monitorRate={};
			var date,minutes,hours,time;

		    if(item.$.Symbol==unit){
		    	console.log('added '+ type);

		    	var intervalMonitor = setInterval(function(){ 
		    		callWebService(function(err,result){
					  
					  	result.Rates.Rate.forEach(function(item){
					          monitorRateList.forEach(function(objMonitoring){

					         
					          	if(item.$.Symbol==objMonitoring.unit){
					          		console.log('--------------');
					          		console.log(item.$.Symbol);
					          		console.log('--------------');
						          	
						          	console.log(type);

						          	date = new Date();
				                    minutes = String(date.getMinutes());
				                    hours = String(date.getHours());
				                    time = hours.concat(".",minutes);

					            	if(type=="buy"){
					            		console.log('Initial  ask rate  '+ objMonitoring.ask + ' Now Bid ' + item.Bid);
					            		if(objMonitoring.rate<item.Bid){
					            		
					            			if(objMonitoring.sentLastMailtime==undefined){
					            				sendMail("first time ",unit);
					            				objMonitoring.sentLastMailtime = time;
					            				console.log('1 time');

					            			}else{
					            				var timeDiff = time - objMonitoring.sentLastMailtime ;
					            				console.log('timeDiff '+ timeDiff);
					                            if(timeDiff>0.05){
					                                console.log("SAME - SEND AN EMAIL pass more than 5 min " + time);
					                                objMonitoring.sentLastMailtime = time;
					                                sendMail("more than 5 hit again",unit);
					                            }else{
					                              console.log('has send within 5 min '+time);
					                            }

					            			}
					            			
					            		}else{
					            			console.log('not passed in buy');
					            			
					            		}
					            	}else{
					            		console.log('sell');
					            		console.log('Initial  bid rate  '+ objMonitoring.bid + ' Now Ask ' + item.Ask);
					            		if(objMonitoring.rate>item.Ask){
					            			if(objMonitoring.sentLastMailtime==undefined){
					            				sendMail("first time ",unit);
					            				objMonitoring.sentLastMailtime = time;
					            				console.log('1 time');

					            			}else{
					            				var timeDiff = time - objMonitoring.sentLastMailtime ;
					            				console.log('timeDiff '+ timeDiff);
					                            if(timeDiff>0.05){
					                                console.log("SAME - SEND AN EMAIL pass more than 5 min " + time);
					                                objMonitoring.sentLastMailtime = time;
					                                sendMail("more than 5 hit again",unit);
					                            }else{
					                              console.log('has send within 5 min '+time);
					                            }

					            			
					            			}

					            		}else{
					            			console.log('not passed in sell');
					            		}
					            		
					            	}

							    }else{
							    	
						        }

					          });
					     });
					});
				},30000);	            

		    	monitorRate={id:1,Date:new Date(),unit:unit,type:type,rate:rate,bid:item.Bid,ask:item.Ask,monitor:intervalMonitor};
				monitorRateList.push(monitorRate);
			}else{

			}	
		});	

	});
	result.end("sent");

});



app.get('/',function(req,res){
	console.log('smthing there.....');
	res.sendfile('index.html');
});


var monitorGraphList= new Array();

function monitorGraph(callback){
	callWebService(function(err,result){
		callback(err,result);
	});

}





app.get('/monitorRateStop',function(req,res){
	var unit = req.query.unit;
	console.log("----------------stopping -----------------------------");
	monitorRateStop(unit,function(monitorRateList){
		
		console.log(monitorRateList);
	});
	res.end("sent");
});


function monitorRateStop(unit,callback){
	monitorRateList.forEach(function(objMonitoring){

		 if(unit==objMonitoring.unit){
		 	console.log('going to stop ' + unit);
		 	console.log(objMonitoring.monitor);
		 	clearInterval(objMonitoring.monitor);


monitorRateList = monitorRateList.filter(item => item !== objMonitoring);

console.log("ARRAY Length " + monitorRateList.length); 




		 }else{
		 	console.log('????	');
		 }
	});

	callback(monitorRateList);

}





//web service 
function callWebService(callback){

 var parser = new xml2js.Parser();

 parser.on('error', function(err) { console.log('Parser error', err); });

 var data = '';
 http.get('http://rates.fxcm.com/RatesXML', function(res) {
     if (res.statusCode >= 200 && res.statusCode < 400) {
       res.on('data', function(data_) { data += data_.toString(); });
       res.on('end', function() {
         // console.log('------------------DATS-----------', data);
         
         parser.parseString(data, function(err, result) {
          callback(err, result);
         });
       });
     }
   });

}

function sendMail(subject,unit){
	

	var mailOptions={
		to : 'dev@icebergcoldrooms.com.au',
		subject : subject,
		text : unit +' has hit the point'
	}
	console.log(mailOptions);

	smtpTransport.sendMail(mailOptions, function(error, response){
   	 if(error){
        	console.log(error);
		//res.end("error");
	 }else{
        	console.log("Message sent: " + response.message);
		//res.end("sent");
    	 }
});


}



