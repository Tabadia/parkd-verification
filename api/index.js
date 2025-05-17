import express from 'express';
import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb';

const app = express();

// Initialize DynamoDB client with environment variables
const dynamoDb = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-west-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const TABLE_NAME = process.env.DYNAMODB_TABLE;

// Middleware to parse JSON bodies
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Verify permit endpoint
app.get('/api/verify/:permitNumber', async (req, res) => {
  try {
    const { permitNumber } = req.params;
    
    if (!permitNumber) {
      return res.status(400).json({ error: 'Permit number is required' });
    }

    const params = {
      TableName: TABLE_NAME,
      Key: {
        licensePlateTag: { S: permitNumber.toUpperCase() }
      }
    };

    const command = new GetItemCommand(params);
    const { Item } = await dynamoDb.send(command);

    if (!Item) {
      return res.json({ valid: false });
    }

    return res.json({ valid: true });
  } catch (error) {
    console.error('Error verifying permit:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default app;
