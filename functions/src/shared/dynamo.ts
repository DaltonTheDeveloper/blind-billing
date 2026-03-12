import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, UpdateCommand, ScanCommand } from '@aws-sdk/lib-dynamodb'

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' })
const dynamo = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true }
})

const TABLES = {
  merchants: process.env.MERCHANTS_TABLE || 'blind-billing-merchants-dev',
  transactions: process.env.TRANSACTIONS_TABLE || 'blind-billing-transactions-dev',
  audit: process.env.AUDIT_TABLE || 'blind-billing-audit-dev',
}

export { dynamo, TABLES, PutCommand, GetCommand, QueryCommand, UpdateCommand, ScanCommand }
