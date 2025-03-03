const serverless = require('serverless-http')
const express = require('express')
const AWS = require('aws-sdk')
const app = express()

const STATUS_TABLE = process.env.STATUS_TABLE;
const IS_OFFLINE = process.env.IS_OFFLINE;
let dynamoDb;
if (IS_OFFLINE === 'true') {
  dynamoDb = new AWS.DynamoDB.DocumentClient({
    region: 'localhost',
    endpoint: 'http://localhost:8000'
  })
} else {
  dynamoDb = new AWS.DynamoDB.DocumentClient();
};
 
app.get('/', function (req, res) {
  res.send('OK')
})

app.get('/get', function (req, res) {
  const params = {
    TableName: STATUS_TABLE,
    Key: {
        envName: 'development',
    },
  }

  dynamoDb.get(params, (error, result) => {
    if (error) {
      console.log('– – – –')
      console.log(error);
      console.log('– – – –')
      res.status(400).send('CRASHED');
    }

    if (result.Item) {
      const {command} = result.Item;
      res.send(command);
    } else {
      res.status(404).send("Entry not found");
    }
  });
})

app.get('/set/:command', function (req, res) {
  const command = req.params.command
	
  const params = {
    TableName: STATUS_TABLE,
    Item: {
      envName: 'development',
      command,
    },
  };
 
  dynamoDb.put(params, (error) => {
    if (error) {
      console.log('– – – –')
      console.log(error);
      console.log('– – – –')
      res.status(400).send('CRASHED');
    }

    res.send(command)
  });
})
 
module.exports.handler = serverless(app)