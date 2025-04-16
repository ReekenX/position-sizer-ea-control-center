const serverless = require('serverless-http')
const express = require('express')
const AWS = require('aws-sdk')
const app = express()
const bodyParser = require('body-parser')

app.use(express.json());

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
  res.status(200).send('OK')
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
      console.warn('Failed with error: ', error);
      res.status(400).send('CRASHED');
    }

    if (result.Item) {
      const {command} = result.Item;
      console.log('Fetched status: ', command);
      res.status(200).send(command);
    } else {
      console.warn('Failed with: not found item');
      res.status(404).send("NOT FOUND");
    }
  });
})

function setCommand(command, res) {
  const params = {
    TableName: STATUS_TABLE,
    Item: {
      envName: 'development',
      command,
    },
  };
 
  dynamoDb.put(params, (error) => {
    if (error) {
      console.warn('Failed with error: ', error);
      res.status(400).send('CRASHED');
    }

    console.log('New status: ', command);

    res.status(200).send(command)
  });
}

app.all('/set/:command', function (req, res) {
  setCommand(req.params.command, res)
})

app.all('/log', function (req, res) {
  setCommand(req.body.command, res)
})
 
module.exports.handler = serverless(app)