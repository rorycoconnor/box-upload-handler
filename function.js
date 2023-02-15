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
}
