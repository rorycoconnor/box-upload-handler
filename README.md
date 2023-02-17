# box-upload-handler
Tool for reacting to new uploads and moving them to quarantine if too large.

# Getting Started
It is assumed that when using this repository, the user has access to a Box enterprise-level account.

This repository requires three components:
* Access to a cloud service capable of executing code (AWS Lambda/Google Cloud Functions/Azure Functions)
* A Box Skill application
* A Box Client Credentials Grant Application
* Access to a cloud service capable of executing code (AWS Lambda/Google Cloud Functions/Azure Functions)

# Setting up the executiion environment
For example purposes, we will use AWS Lambda for these steps.

1. Navigate to your AWS Console and access Lambda Console.
2. Click *Create Function*. 
3. Enter a Function Name ex. upload-handler.
4. Ensure the Runtime is set to *Node.js 18.x*.
5. Under "Advanced Settings", ensure *Enable Function URL* is checked. 
6. Under "Auth Type", select None. 
6. Click *Create Function*. 
7. Make note of the Function URL generated on the right-hand side of the Lambda Console. 
![Screen Shot 2023-02-15 at 10 36 21 AM](https://user-images.githubusercontent.com/31426874/219075483-21bafc8f-365c-49bc-a94f-86f18adb7d9b.png)

# Creating the Box Skill

1. Navigate to https://app.box.com/developers/console and log in if required. 
2. Click *Create New App*.
3. Select *Box Custom Skill* and enter a name for your app ex. Large Upload Handler.
4. In the Configuration tab, enter the Function URL from above into the *Invocation URL* field. 
5. Click Save Changes. 

# Enabling the Box Skill
These steps must be performed by the Primary Admin of the Box Enterprise Instance. 

1. Navigate to https://app.box.com/master/skills.
2. Click *Add Skill*.
3. In the text box, enter the Client ID of the Box Skill app previously created. 
4. Select the scope of the Box Skill. This can monitor all uploads or just uploads into selected folders. 
5. Click *Enable*.

All uploads into the selected folders will now send notifications to the AWS Lambda Function. 

# Creating and Enabling the Box File Handler app

1. Navigate back to https://app.box.com/developers/console and click *Create New App*.
2. Select *Custom App*, choose *Client Credentials Grant* as the Authentication Method, and name your app.
3. In the Configuration tab, under the App Access Level tab, select *App Access Only*. 
4. Under Application Scopes, select *Read all files and folders stored in Box* and *Write all files stored in Box*. 
5. Click Save Changes. 
6. In the Authorization tab, click *Review and Submit*.
7. Enter "Application for moving large files to Quarantine" in the App Description Box. 
8. Click *Submit*. 

A Box Admin must now authorize the application as shown here: https://developer.box.com/guides/authorization/custom-app-approval/

Once the Application is authorized, a Service Account will be created in the Application Console "General Settings" tab. Copy the email address of that user.
It will follow this format: AutomationUser_########_jG383jd@boxdevedition.com

# Set up Box Quarantine

1. In the Box Web Application, create a new folder called "Quarantine". 
2. Invite the Service Account for the Box File Handler App as an Editor or Co-Owner on that folder. 
3. Additionally, invite the Service Account as Editor or Co-Owner to any folder in which you'd like to monitor uploads. For example, a "Customers" folder.

# Configure the Node.js code

1. Clone this repository to your desktop. 
2. Run npm install from the terminal to include the necessary packages. 
3. In *functions.js*, replace the placeholder values. 
* CLIENT_ID - Client ID of the Box File Handler app. 
* CLIENT_SECRET - Client Secret of the Box File Handler App
* PINNACLE_ENTERPRISE_ID - Box Enterprise ID for the Pinnacle Box Instance
* BOX_QUARANTINE_FOLDER_ID - The folder ID of the Quarantine Folder. 
* AWS_REGION - The region Amazon SES (Simple Email Service) is configured in.
* SENDER_EMAIL - The email from which notifications for failed uploads will be sent.

Note: The current max file size in the script is 1MB for testing purposes. Replace that value with the commented value to increase that limit to 200MB.

# Deploy the code to AWS Lambda

1. In your File Explorer/Finder window, navigate to the cloned repository. 
2. Select the following files/folders:
* functions.js
* package.json
* package-lock.json
* node_modules
3. Compress all of these items into a .zip file.
4. In the AWS Lambda Console, select "Upload From" in the Code tab, and select .zip file. 
5. Upload the .zip file created in Step 3.
6. Under "Runtime Settings", click Edit. 
7. Change the Handler field to "function.handleUpload" and save the change.
8. Your code will automatically deploy. 

# Set up Amazon SES (Simple Email Service)
This tool uses Amazon SES to send notifications to the uploading user that their upload failed because the file was too large. 

1. In the AWS Console, navigate to the SES Console. 
2. Click "Create Identity".
3. Choose "Email Address" and enter the Email Address from which you would like to send the failed upload notifications. 
4. Navigate to the email inbox for the address used in Step 3 to confirm the identity. 

For testing purposes, both the sender and recipient email must be confirmed identities. Repeat the process above for any email address you would 
like to use for testing. 



