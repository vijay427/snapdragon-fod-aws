/**
 * Unit tests for Catalog Handler Lambda
 */

import { handler } from '../../../src/lambda/catalog-handler';
import { APIGatewayProxyEvent } from 'aws-lambda';

describe('Catalog Handler', () => {
  it('should return 200 status code', async () => {
    const mockEvent = {
      httpMethod: 'GET',
      path: '/catalog',
      headers: {},
      body: null,
    } as APIGatewayProxyEvent;

    const result = await handler(mockEvent);

    expect(result.statusCode).toBe(200);
  });

  it('should return valid JSON response', async () => {
    const mockEvent = {
      httpMethod: 'GET',
      path: '/catalog',
      headers: {},
      body: null,
    } as APIGatewayProxyEvent;

    const result = await handler(mockEvent);

    expect(() => JSON.parse(result.body)).not.toThrow();
  });

  it('should return array of features', async () => {
    const mockEvent = {
      httpMethod: 'GET',
      path: '/catalog',
      headers: {},
      body: null,
    } as APIGatewayProxyEvent;

    const result = await handler(mockEvent);
    const body = JSON.parse(result.body);

    expect(Array.isArray(body.data)).toBe(true);
  });
});
