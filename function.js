
//Initialize the SES Client for Upload Failed Notifications
const { SESClient, SendEmailCommand } = require("@aws-sdk/client-ses");
const ses = new SESClient({region: ['AWS_REGION']});
const uuid = require('uuid')

var BoxSDK = require('box-node-sdk');
var sdkConfig = {
    boxAppSettings: {
        clientID: '[CLIENT_ID]',
        clientSecret: '[CLIENT_SECRET]'
    },
    enterpriseID: "[PINNACLE_ENTERPRISE_ID]"
}

const sdk = BoxSDK.getPreconfiguredInstance(sdkConfig);
const client = sdk.getAnonymousClient();

//Current file size check is for a 1MB file for testing purposes. Change value below to 209,715,200 to test for 200MB.
const maximumFileSize = '1048576'
const quarantineFolderID = '[BOX_QUARANTINE_FOLDER_ID]';

exports.handleUpload = (req, res) => {
    try {
        //Parse the webhook payload from the req object.
        const body = JSON.parse(req.body);
        
        if (body.source.size >= maximumFileSize ) {
            console.log('This File is Too Large!')
            //Ensure that the file is not already quarantined to prevent an infinite loop.
            if (body.source.parent.id != quarantineFolderID) {
                //Use the Box SDK to move the file into Quarantine
                client.files.move(body.source.id, quarantineFolderID)
                    .then(response => {
                        console.log(response)

                        //Send Notification to user that their upload failed.
                        sendEmail(body.event.created_by.login)

                        //Rename the file in Quarantine to prevent duplicates.
                        const uniqueName = renameFileForMoveToQuarantine(body.source, body.event.created_by.login);
                        client.files.update(body.source.id, {name: uniqueName, fields: 'name'})
                            .then(resp => {
                                console.log('File Successfully Renamed')
                            }).catch(e => {
                                console.log('Error renaming file', e);
                            })
                    }).catch(e => {
                        console.log('error', e)
                    })
            } else {
                console.log('This file is already quarantined')
            }
            
        } else {
            console.log('file size good, keep it where it is.')
        }

    } catch (e) {
        console.error(e);

    }
};

//Create a Parameters object for the notification email
const createSendEmailCommand = (toAddress, fromAddress) => {
    return new SendEmailCommand({
      Destination: {
        /* required */
        CcAddresses: [
          /* more items */
        ],
        ToAddresses: [
          toAddress,
          /* more To-email addresses */
        ],
      },
      Message: {
        /* required */
        Body: {
          /* required */
          Text: {
            Charset: "UTF-8",
            Data: "The file you attempted to upload was too large. Please only upload files smaller than 200MB",
          },
        },
        Subject: {
          Charset: "UTF-8",
          Data: "Upload failed",
        },
      },
      Source: fromAddress,
    });
  };

//Function to send email to uploading user. 
const sendEmail = async (user) => {
    const sendEmailCommand = createSendEmailCommand(
        user,
        "[SENDER_ADDRESS]"
    );

    try {
        return await ses.send(sendEmailCommand);
    } catch (e) {
        console.error("Failed to send email.", e);
        return e;
    }
};

const renameFileForMoveToQuarantine = (source, user) => {
    // const nameParts = source.name.split('.');
    // const newFileName = nameParts[0] + ' - ' + user + ' - ' + uuid.v4() + nameParts[1];
    const newFileName = user + ' - ' + uuid.v4() + ' - ' + source.name;
    return newFileName;
}
