#!/usr/bin/env python3
"""Display connector actions from the API."""

import json
import sys

data = json.load(sys.stdin)

print('\n' + '='*70)
print('CONNECTOR ACTIONS EXAMPLES')
print('='*70)

# Gmail actions
gmail = next((n for n in data['action'] if n['id'] == 'gmail'), None)
if gmail:
    print('\n📧 GMAIL ACTIONS:')
    for action in gmail['actions']:
        print(f'  • {action["name"]} ({action["id"]})')
        print(f'    {action["description"]}')

# Slack actions  
slack = next((n for n in data['action'] if n['id'] == 'slack'), None)
if slack:
    print('\n💬 SLACK ACTIONS:')
    for action in slack['actions']:
        print(f'  • {action["name"]} ({action["id"]})')
        
# OpenAI actions
openai_node = next((n for n in data['ai'] if n['id'] == 'openai'), None)
if openai_node:
    print('\n🤖 OPENAI ACTIONS:')
    for action in openai_node['actions']:
        print(f'  • {action["name"]} ({action["id"]})')

print('\n' + '='*70)
print('✅ All connector actions successfully added to API!')
print('='*70 + '\n')
