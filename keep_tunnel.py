import subprocess, time

while True:
    print('Starting localtunnel...')
    try:
        proc = subprocess.run([
            'npx.cmd', '--yes', 'localtunnel',
            '--port', '3000',
            '--local-host', '127.0.0.1',
            '--subdomain', 'rasa-ai-food'
        ])
    except Exception as e:
        print('Error:', e)
    print('Tunnel exited, restarting in 2 seconds...')
    time.sleep(2)
