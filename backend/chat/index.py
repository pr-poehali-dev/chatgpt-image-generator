import json
import os
from typing import Dict, Any, List
import requests

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Process chat messages with YandexGPT
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
    
    api_key = os.environ.get('YANDEX_API_KEY')
    folder_id = os.environ.get('YANDEX_FOLDER_ID')
    
    if not api_key or not folder_id:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Yandex API key or Folder ID not configured'})
        }
    
    yandex_messages = []
    for msg in messages:
        yandex_messages.append({
            'role': msg['role'],
            'text': msg['content']
        })
    
    url = 'https://llm.api.cloud.yandex.net/foundationModels/v1/completion'
    headers = {
        'Authorization': f'Api-Key {api_key}',
        'Content-Type': 'application/json'
    }
    
    payload = {
        'modelUri': f'gpt://{folder_id}/yandexgpt-lite/latest',
        'completionOptions': {
            'stream': False,
            'temperature': 0.6,
            'maxTokens': 2000
        },
        'messages': yandex_messages
    }
    
    response = requests.post(url, headers=headers, json=payload)
    
    if response.status_code != 200:
        return {
            'statusCode': 502,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': f'Yandex API error: {response.text}'})
        }
    
    result = response.json()
    ai_message = result['result']['alternatives'][0]['message']['text']
    
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