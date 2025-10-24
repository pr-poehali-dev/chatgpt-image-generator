import json
import os
from typing import Dict, Any
import requests
import base64

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Generate images using Yandex ART (YandexGPT Image Generation)
    Args: event - dict with httpMethod, body (prompt)
          context - object with request_id attribute
    Returns: HTTP response with image base64
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
    prompt: str = body_data.get('prompt', '')
    
    if not prompt:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Prompt is required'})
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
    
    url = 'https://llm.api.cloud.yandex.net/foundationModels/v1/imageGenerationAsync'
    headers = {
        'Authorization': f'Api-Key {api_key}',
        'Content-Type': 'application/json'
    }
    
    payload = {
        'modelUri': f'art://{folder_id}/yandex-art/latest',
        'generationOptions': {
            'seed': 17
        },
        'messages': [
            {
                'weight': 1,
                'text': prompt
            }
        ]
    }
    
    response = requests.post(url, headers=headers, json=payload)
    
    if response.status_code != 200:
        return {
            'statusCode': 502,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': f'Yandex ART API error: {response.text}'})
        }
    
    result = response.json()
    operation_id = result['id']
    
    check_url = f'https://llm.api.cloud.yandex.net:443/operations/{operation_id}'
    
    import time
    for _ in range(30):
        time.sleep(2)
        check_response = requests.get(check_url, headers={'Authorization': f'Api-Key {api_key}'})
        
        if check_response.status_code == 200:
            operation_result = check_response.json()
            if operation_result.get('done'):
                image_base64 = operation_result['response']['image']
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'isBase64Encoded': False,
                    'body': json.dumps({
                        'image_url': f'data:image/png;base64,{image_base64}',
                        'request_id': context.request_id
                    })
                }
    
    return {
        'statusCode': 504,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({'error': 'Image generation timeout'})
    }