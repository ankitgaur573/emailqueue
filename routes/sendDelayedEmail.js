'use strict';

const router = require('express').Router();
const emails = require('../queue/emails');

router.post('/', (req, res, next) => {
  let emailId = req.body.Emailid;
  let data = req.body.Data;
  let fileName = req.body.FileName;
  let timeout = req.body.Timeout;

    if(emailId && validateEmail(emailId) && data && fileName && timeout){
        emails.create(req.body, (err) => {
            if (err) {
                return res.json({
                    error: err,
                    success: false,
                    message: 'Could not send emails',
                });
            } else {
                return res.json({
                    error: null,
                    success: true,
                    message: 'A mail will be sent to you in '+ timeout+' seconds'
                });
            }
        })
    }else {
        return res.json({
            success: false,
            message: 'Field(s) missing.',
        });
    }
});

function validateEmail(email)
{
    var re = /\S+@\S+\.\S+/;
    return re.test(email);
}

module.exports = router;