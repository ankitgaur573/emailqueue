'use strict';

let redisConfig;
if (process.env.NODE_ENV === 'production') {
  redisConfig = {
    redis: {
      port: process.env.REDIS_PORT,
      host: process.env.REDIS_HOST,
      auth: process.env.REDIS_PASS,
      options: {
        no_ready_check: false
      }
    }
  };
} else {
  redisConfig = {};
}

const kue = require('kue');
const queue = kue.createQueue(redisConfig);
queue.watchStuckJobs(1000 * 10);
const nodemailer = require('nodemailer');
const fs = require('fs');
const uuidv1 = require('uuid/v1');

var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'ankitgaur573@@gmail.com',
        pass: 'Honey@008'
    }
});

queue.on('ready', () => {
  console.info('Queue is ready!');
});

queue.on('error', (err) => {
  console.error('There was an error in the main queue!');
  console.error(err);
  console.error(err.stack);
});


// Set up UI
kue.app.listen(process.env.KUE_PORT);
kue.app.set('title', 'Kue');

function sendEmails(data, done) {
    let base64Image = data.Data.split(';base64,').pop();
    let id = uuidv1();
    data.id = id;
    fs.writeFile('./images/'+id+'.png', base64Image, {encoding: 'base64'}, function(err) {
        if(err) console.log(err);
        else{
            queue.create('emails', data)
                .priority('critical')
                .attempts(8)
                .backoff(true)
                .removeOnComplete(false)
                .delay(data.Timeout*1000)
                .save(err => {
                    if (err) {
                        console.error(err);
                        done(err);
                    }
                    if (!err) {
                        done();
                    }
                });
        }
    });
}

// Process up to 20 jobs concurrently
queue.process('emails', 20, function(job, done){

  let data = job.data;
  let emailTo = data.Emailid;
  let fileName = data.FileName;
  let jobId = data.id;
  let imageToSend = jobId+".png";

    var mailOptions = {
        from: 'ankitgaur573@@gmail.com',
        to: emailTo,
        subject: "Ankit delayed email",
        text: fileName,
        attachments: [
            {   // utf-8 string as an attachment
                filename: fileName,
                path: './images/'+imageToSend
            }]
    };

    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
  done();
});

module.exports = {
  create: (data, done) => {
      sendEmails(data, done);
  }
};