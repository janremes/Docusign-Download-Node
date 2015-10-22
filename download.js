// Unit Testing Imports
var assert = require('assert');
var async = require('async');
var fs = require('fs');

var docusign = require('docusign-node');

var integratorKey = '',                   // Integrator Key associated with your DocuSign Integration
  email = 'EMAIL', //'', //           // Email for your DocuSign Account
  password = 'PASSWORD',  //'', //       // Password for your DocuSign Account
  docusignEnv = 'demo',                  // DocuSign Environment generally demo for testing purposes
  fullName = 'Joan Jett',             // Recipient's Full Name
  recipientEmail = 'joan.jett@example.com', // Recipient's Email
  templateId = '***',                   // ID of the Template you want to create the Envelope with
  templateRoleName = '***',                   // Role Name of the Template
  debug = true;




var attachCertificate = false;

async.waterfall([

  // **********************************************************************************
  // Step 1 - Initialize DocuSign Object with Integratory Key and Desired Environment
  // **********************************************************************************
  function init(next) {
    docusign.init(integratorKey, docusignEnv, debug, function (error, response) {
      assert.ok(!error, 'Unexpected ' + error);
      var message = response.message;
      assert.strictEqual(message, 'successfully initialized');
      next(null);
    });
  },

  // **********************************************************************************
  // Step 2 - Authenticate Youself With DocuSign to Recieve an OAuth Token and BaseUrl
  // **********************************************************************************
  function createClient(next) {
    docusign.createClient(email, password, function (error, response) {
      assert.ok(!error, 'Unexpected ' + error);
      next(null, response);
    });
  },
      
  // **********************************************************************************
  // Step 3 - Get Envelope List
  // **********************************************************************************
  function getEnvelopeList(client, next) {

    // retrieve envelopes one year old from now
    var date = new Date();
    date.setYear(2014);

    client.envelopes.getEnvelopeList(date, function (err, response) {

      var envelopeIds = [];

      if (err != null) {
        console.log('retrieving envelopes failed ' + err)
      } else {
        console.log('The Envelopes from ' + date + ' to the present is: \n' + JSON.stringify(response));

        var envs = response.envelopes;
        for (var i = 0; i < envs.length; i++) {
          var e = envs[i];
          envelopeIds.push(e.envelopeId);
        }
      }

      assert.ok(!err);

      next(null, client, envelopeIds);
    });
  },

  // **********************************************************************************
  // Step 4 - Get Signed Documents
  // **********************************************************************************
  function getSignedDocuments(client, envelopeIds, next) {

    async.each(envelopeIds, function (envelope, callback) {
 
      // Perform operation on file here. 
      console.log('Processing envelope id ' + envelope);

      client.envelopes.getSignedDocuments(envelope, null, attachCertificate, function (error, response) {
        assert.ok(!error, 'Unexpected ' + error);

        if (error) {
          console.log('Envelope getting failed' + error);
          callback(error);

        } else {

          var filename = 'files/doc' + envelope + '.pdf'
          fs.writeFile(filename, response, 'binary', function (err) {

            if (err) {
              console.log('Envelope saving failed' + err);
              callback(err);
            } else {
              console.log('Envelope processed ' + envelope);
              callback();
            }
          });
        }


      });

    }, function (err) {
      if (err) {
        console.log('A envelope downloading failed' + err);
      } else {
        console.log('All envelopes have been processed successfully');
        next(null, client);
      }
    });




  },
  // **********************************************************************************
  // Step 5 - Revoke OAuth Token for Logout
  // **********************************************************************************
  function logOut(client, next) {
    client.logOut(function (err, response) {
      assert.strictEqual(err, null);
      next(null);
    });
  }
], function () {
  console.log('job done');
});


