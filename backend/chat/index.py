import json
import os
import httpx
from typing import Dict, Any, List
from openai import OpenAI

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Process chat messages with ChatGPT-5
    Args: event - dict with httpMethod, body (messages history)
          context - object with request_id attribute
    Returns: HTTP response with AI message
    '''
    method: str = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    api_key = os.environ.get('OPENAI_API_KEY')
    if not api_key:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'OpenAI API key not configured'})
        }
    
    body_data = json.loads(event.get('body', '{}'))
    messages: List[Dict[str, str]] = body_data.get('messages', [])
    
    if not messages:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Messages array is required'})
        }
    
    http_client = httpx.Client()
    client = OpenAI(api_key=api_key, http_client=http_client)
    
    response = client.chat.completions.create(
        model='gpt-4o',
        messages=messages,
        max_tokens=2000,
        temperature=0.7
    )
    
    ai_message = response.choices[0].message.content
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'isBase64Encoded': False,
        'body': json.dumps({
            'message': ai_message,
            'request_id': context.request_id
        })
    }