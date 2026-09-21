#!/usr/bin/env python3
"""Local-only preview, serving the portable asset directory."""
import argparse, errno, functools, http.server, webbrowser
from pathlib import Path

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--port',type=int,default=8765)
    parser.add_argument('--no-open',action='store_true')
    args=parser.parse_args()
    root=Path(__file__).resolve().parent
    handler=functools.partial(http.server.SimpleHTTPRequestHandler,directory=str(root))
    server=None
    for port in range(args.port,args.port+20):
        try:
            server=http.server.ThreadingHTTPServer(('127.0.0.1',port),handler)
            break
        except OSError as error:
            if error.errno != errno.EADDRINUSE:raise
    if server is None:raise RuntimeError('没有可用的本机预览端口。')
    url=f'http://127.0.0.1:{server.server_address[1]}/web/'
    print(f'Robot Atlas: {url}\n按 Ctrl+C 停止本地预览。',flush=True)
    if not args.no_open:webbrowser.open(url)
    try:server.serve_forever()
    except KeyboardInterrupt:pass
    finally:server.server_close()

if __name__=='__main__':main()
